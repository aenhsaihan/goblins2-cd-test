import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import {identifyGameRoot,validateCdFile} from '../docs/game-library.js';
const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const records=['INTRO.STK','GOBNEW.LIC','track1.ogg','INSTALL.ASK'].map(path=>({path:'game/'+path,size:path==='INTRO.STK'?4328864:100}));
test('engine is the byte-identical, iPhone-confirmed audio-fixed pair',()=>{
  const hashes=['41a8319a4999f486b4883e11f3797f7e915aeee0f0f256fb79bfd177583999b7','7eeac96190be191ec3f87f62ec1a1987660fe4862b1cbe93f7e697796f3c8b42'];
  for(const [i,ext] of ['js','wasm'].entries())assert.equal(createHash('sha256').update(readFileSync(new URL(`docs/engine/7eeac96190be191e/scummvm.${ext}`,root))).digest('hex'),hashes[i]);
});
test('CD root detection requires matching game data, cue table and playable audio together',()=>{
  assert.equal(identifyGameRoot(records).root,'game');
  assert.match(identifyGameRoot(records).release,/v1\.000/);
  assert.throws(()=>identifyGameRoot(records.filter(r=>!r.path.endsWith('GOBNEW.LIC'))),/GOBNEW.LIC/);
  assert.throws(()=>identifyGameRoot(records.filter(r=>!r.path.endsWith('track1.ogg'))),/track1.ogg/);
  assert.throws(()=>identifyGameRoot(records.map(r=>({...r,path:r.path.replace('track1.ogg','track1.flac')}))),/preparation/);
  assert.throws(()=>identifyGameRoot([{path:'floppy/INTRO.STK',size:805146},{path:'floppy/DISK2.STK',size:970686}]),/CD test/);
});
test('hash validation rejects damaged or different-release files before storage',async()=>{
  await assert.rejects(validateCdFile('game/INTRO.STK',new Blob(['not the game'])),/different or damaged/);
  await assert.rejects(validateCdFile('game/GOBNEW.LIC',new Blob(['wrong cues'])),/different or damaged/);
  await assert.rejects(validateCdFile('game/track1.ogg',new Blob(['renamed FLAC'])),/Ogg Vorbis/);
  await validateCdFile('game/INSTALL.ASK',new Blob(['optional keyboard data']));
});
function load(){
  const elements=new Map(),fetches=[];
  const element=id=>{if(!elements.has(id))elements.set(id,{style:{},value:'',addEventListener(){},classList:{add(){},toggle(){}}});return elements.get(id);};
  const document={getElementById:element,querySelector:element,createElement:()=>({}),addEventListener(){},body:{appendChild:script=>document.script=script}};
  const location=new URL('https://example.github.io/goblins2-cd-test/player.html');
  const window={parent:{postMessage(){}},fetch:async(input,options)=>{fetches.push({input,options});return new Response('ok');}};
  const context={window,document,location,history:{replaceState:(_a,_b,url)=>{context.rewritten=url;}},URL,URLSearchParams,Request,Response,Headers,navigator:{userAgent:'Test',platform:'Test',maxTouchPoints:0},XMLHttpRequest:class{open(){}},innerWidth:800,innerHeight:600,addEventListener(){},setTimeout,clearTimeout,console};
  runInNewContext(read('docs/player.html').match(/<script>([\s\S]*?)<\/script>/)[1],context);
  return {window,document,context,fetches};
}
test('bundled runtime and timer fix are always selected under the project subpath',()=>{
  const p=load();assert.match(p.document.script.src,/^\/goblins2-cd-test\/engine\/7eeac96190be191e\/scummvm.js$/);assert.match(p.context.rewritten,/service_timers=1/);assert.equal(p.context.midiOutputMap.size,0);
});
test('virtual data requests use the project subpath, not the account root',async()=>{
  const p=load();await p.window.fetch('/data/index.json');assert.equal(p.fetches[0].input,'https://example.github.io/goblins2-cd-test/data/index.json?pack=gob2-cd-support-2');
});
test('game files and IDBFS HOME are isolated from both working games',()=>{
  const player=read('docs/player.html'),library=read('docs/game-library.js'),shell=read('docs/shell.js');
  assert.match(library,/goblins2-cd-library/);assert.match(player,/indexedDB.open\('goblins2-cd-library'/);
  assert.match(player,/ENV.HOME = '\/home\/goblins2-cd'/);assert.match(player,/savepath=\/home\/goblins2-cd/);
  assert.match(shell,/--path=\/games\/gob2-cd gob:gob2/);assert.match(shell,/--config=\/goblins2-cd.ini/);
  assert.doesNotMatch(player,/goblins3|gob3|web_user|goblins2-floppy|kuendig.io|blackbrush12|game-v5/);
  assert.deepEqual(JSON.parse(read('docs/data/index.json')).games,{});
  assert.deepEqual(JSON.parse(read('docs/data/games/index.json')),{});
});
test('phone save-name keyboard invokes ScummVM virtual keyboard, not a fake overlay',()=>{
  const player=read('docs/player.html');
  assert.match(player,/id="keyboard"/);
  assert.match(player,/key\('keydown', 'Control', 'ControlLeft', 17, true\)/);
  assert.match(player,/key\('keydown', 'F7', 'F7', 118, true\)/);
  assert.match(player,/key\('keyup', 'Control', 'ControlLeft', 17, false\)/);
});
test('published tree contains no game archives, images or supplied prepared ZIP',()=>{
  const files=readdirSync(new URL('docs/',root),{recursive:true}).filter(x=>typeof x==='string');
  assert.equal(files.some(x=>/\.(stk|itk|img|7z|bin|cue|ogg|flac|lic|s\d\d)$/i.test(x)),false);
  assert.equal(files.some(x=>/CD_ready\.zip/i.test(x)),false);
  assert.equal(files.some(x=>/\.zip$/i.test(x)&&!x.startsWith('data/')),false);
});
test('every catalogued runtime file and directory exists with the declared size',()=>{
  const check=directory=>{
    const index=JSON.parse(read(`docs/data/${directory}index.json`));
    for(const [name,entry] of Object.entries(index)){
      if(typeof entry==='number')assert.equal(statSync(new URL(`docs/data/${directory}${name}`,root)).size,entry,`${directory}${name}`);
      else check(`${directory}${name}/`);
    }
  };
  check('');
});
