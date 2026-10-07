# omega-7

a figma escape room for hack club's wrong tool. you wake up alone on a dying space station and have to find the escape pod before the oxygen runs out. play it in figma present mode.

the whole game is frames + prototype links, generated from the code in `src/` through the figma plugin api (`use_figma`), so every room, puzzle and click-through is built by script.

- `src/` shared drawing helpers + one file per set of rooms
- `tools/` bundlers for the figma runner
- `web-prototype/` the first html version of the puzzle logic
