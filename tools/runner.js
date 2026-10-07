// what the figma file's stored "runner" does (run through use_figma):
// wipe the page, rebuild every frame from the stored source modules, then turn the
// link tags in the layer names into prototype reactions and set the flow start.
// the prelude (helpers + flow + ui) and the rooms modules are the files in ../src.
// order of modules: helpers, art, flow, ui, rooms1a, rooms1b, rooms2
// entry: loadFonts(); buildTitle(); buildAllQuarters(); buildPoster(); buildAllControl();
//        buildWhiteboard(); buildAllKeypad(); buildAllPod(); buildAllWires(); buildAllEnd();
