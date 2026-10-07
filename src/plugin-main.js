// ---- plugin entry --------------------------------------------------------------
function rowLabels() {
  const rows = [
    [0, 'TITLE  ·  ENDINGS  ·  ABOUT'],
    [1, 'ACT I  ·  SLEEPING QUARTERS'],
    [2, 'ACT I  ·  LOCKER OPEN'],
    [3, 'ACT I  ·  KEYCARD IN HAND'],
    [4, 'ACT II  ·  CONTROL ROOM'],
    [5, 'ACT II  ·  AIRLOCK KEYPAD'],
    [6, 'ACT III  ·  POD BAY'],
    [7, 'ACT III  ·  WIRING'],
    [8, 'LAUNCH'],
  ];
  for (const [row, label] of rows) {
    text(figma.currentPage, 0, row * GRID_Y - 64, label, { font: 'mono', size: 20, fill: C.dim, ls: 8, name: 'row label' });
  }
}

(async () => {
  const page = figma.createPage();
  page.name = 'OMEGA-7 (generated)';
  await figma.setCurrentPageAsync(page);
  page.backgrounds = [{ type: 'SOLID', color: rgb('#080b12') }];
  await loadFonts();
  buildTitle();
  buildAllQuarters();
  buildAllControl();
  buildAllKeypad();
  buildAllPod();
  buildAllWires();
  buildAllEnd();
  buildAllExtra();
  rowLabels();
  const r = await wire();
  if (!r.winReachable || r.unreachable.length) {
    figma.closePlugin('OMEGA-7 built, but the flow check failed: ' + JSON.stringify(r));
    return;
  }
  const title = figma.currentPage.findChild((n) => n.name.startsWith('title · '));
  figma.viewport.scrollAndZoomIntoView([title]);
  figma.closePlugin('OMEGA-7 built: ' + r.frames + ' frames, ' + r.links + ' linked layers. Select the title frame and press Present.');
})();
