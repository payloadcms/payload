'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { defaultJSXConverters, RichText } from '../../../../../exports/react/index.js';
export function RichTextPlugin() {
  const $ = _c(7);
  const [editor] = useLexicalComposerContext();
  let t0;
  if ($[0] !== editor) {
    t0 = editor.getEditorState().toJSON();
    $[0] = editor;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const [editorState, setEditorState] = useState(t0);
  let t1;
  let t2;
  if ($[2] !== editor) {
    t1 = () => editor.registerUpdateListener(t3 => {
      const {
        editorState: editorState_0
      } = t3;
      setEditorState(editorState_0.toJSON());
    });
    t2 = [editor];
    $[2] = editor;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  useEffect(t1, t2);
  let t3;
  if ($[5] !== editorState) {
    t3 = _jsx("div", {
      className: "debug-jsx-converter",
      children: _jsx(RichText, {
        converters: defaultJSXConverters,
        data: editorState
      })
    });
    $[5] = editorState;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}
//# sourceMappingURL=index.js.map