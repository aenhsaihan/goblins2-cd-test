# Gobliins 2 — isolated DOS CD browser test

Separate test for English US **CD v1.000**. The existing Gobliins 2 floppy and Goblins 3 repositories, hosting, game libraries and saves are unchanged. No commercial game data is distributed or uploaded by this player.

Import your own prepared game ZIP or folder: INTRO.STK, GOBNEW.LIC, optional INSTALL.ASK and track1.ogg. This first test verifies the known prepared release and complete audio with SHA-256; it deliberately does not accept the original raw disc bundle, FLAC, other releases or incomplete audio.

## Build and serve

Node 22+: `npm install`, `npm run build`, `npm test`, `npm run dev`. GitHub Pages publishes `docs/` from `main`.

## Runtime and controls

The exact audio-fixed JS/WASM pair from the iPhone-confirmed Goblins 3 work is bundled under `docs/engine/7eeac96190be191e/`. The timer fix is enabled with service_timers=1, the iOS audio queue is retained, and unrelated Web MIDI enumeration is skipped. No engine rebuild or speculative audio tuning is introduced. All licensed runtime assets are served under this project's subpath; proprietary game data comes only from local browser storage.

Drag to move the pointer, tap to click, two-finger tap for right-click. Top-edge original menu → floppy icon → Save/Load. Keyboard opens ScummVM's actual virtual keyboard (Ctrl+F7) for filenames; include Return and then tap its green check. Use Safari Add to Home Screen and landscape on iPhone. Physical-device quality and touch behavior require user verification.

Game database `goblins2-cd-library` and ScummVM HOME/IDBFS save mount `/home/goblins2-cd` are separate from the floppy player's database and `/home/goblins2-floppy`, including on their shared GitHub Pages origin. Save interchange between editions is not promised. No service worker; offline startup is not guaranteed and browser storage may be cleared or evicted.

## Audio preparation

Private preparation used the original disc's TRACK 02 INDEX 01 boundary at 01:29:27 (2352-byte sectors), 44,100 Hz stereo PCM, encoded to Ogg Vorbis without trimming or resampling. Output is 94,152,324 stereo frames (2,134.9733 seconds). All 189 LIC cue ranges fit. Source disc images, game files, prepared ZIP and research outputs remain outside this repository. The supplied ZIP also included a different CD v2.01 data directory and a separate FLAC; neither is mixed into this test's data set.

## Licenses

Frontend: GPL-3.0-or-later; see COPYING. ScummVM source revision, build recipe and complete source patch accompany the bundled runtime in BUILD.txt and SOURCE.patch. fflate is MIT-licensed; license included next to the vendored module. `docs/data/` contains ScummVM support assets, not commercial game data. The four icon metadata XML files come from gui/themes/gui-icons.dat at the same ScummVM source revision; no game-cover images are included. Independent fan project; game trademarks/assets belong to their respective owners.
