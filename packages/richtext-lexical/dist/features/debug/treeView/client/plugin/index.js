'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { TreeView } from '@lexical/react/LexicalTreeView.js';
import * as React from 'react';
export const TreeViewPlugin = () => {
  const $ = _c(2);
  const [editor] = useLexicalComposerContext();
  let t0;
  if ($[0] !== editor) {
    t0 = _jsx(TreeView, {
      editor,
      timeTravelButtonClassName: "debug-timetravel-button",
      timeTravelPanelButtonClassName: "debug-timetravel-panel-button",
      timeTravelPanelClassName: "debug-timetravel-panel",
      timeTravelPanelSliderClassName: "debug-timetravel-panel-slider",
      treeTypeButtonClassName: "debug-treetype-button",
      viewClassName: "tree-view-output"
    });
    $[0] = editor;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
};
//# sourceMappingURL=index.js.map