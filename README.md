# omega-7

a figma escape room for hack club's wrong tool. you wake up alone on a dying space station and have to find the escape pod before the oxygen runs out. play it in figma present mode.

the whole game is frames + prototype links, generated from the code in `src/` through the figma plugin api, so every room, puzzle and click-through is built by script.

## build it yourself (free, no mcp needed)

1. `node tools/build-plugin.js` (writes `plugin/code.js`)
2. in figma desktop: plugins > development > import plugin from manifest > `plugin/manifest.json`
3. run "OMEGA-7 builder". it makes a new page with 35 frames, wires the prototype and checks the win screen is reachable
4. select the title frame and press present

## solution (spoilers)

crew 8 x deck 7 = pin 56, then wires red > triangle, blue > square, yellow > circle.

## layout

- `src/` shared drawing helpers, one file per set of rooms, `wire.js` for the prototype links
- `tools/` build scripts
- `web-prototype/` the first html version of the puzzle logic
