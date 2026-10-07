// ---- plugin entry --------------------------------------------------------------
(async () => {
  const page = figma.createPage();
  page.name = 'OMEGA-7 (generated)';
  await figma.setCurrentPageAsync(page);
  await loadFonts();
  buildTitle();
  buildAllQuarters();
  buildPoster();
  buildAllControl();
  buildWhiteboard();
  buildAllKeypad();
  buildAllPod();
  buildAllWires();
  buildAllEnd();
  const r = await wire();
  if (!r.winReachable || r.unreachable.length) {
    figma.closePlugin('OMEGA-7 built, but the flow check failed: ' + JSON.stringify(r));
    return;
  }
  const title = figma.currentPage.findChild((n) => n.name.startsWith('title · '));
  figma.viewport.scrollAndZoomIntoView([title]);
  figma.closePlugin('OMEGA-7 built: ' + r.frames + ' frames, ' + r.links + ' linked layers. Select the title frame and press Present.');
})();
