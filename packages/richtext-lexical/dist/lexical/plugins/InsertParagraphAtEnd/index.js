/* eslint-disable jsx-a11y/click-events-have-key-events */'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getRoot } from 'lexical';
import React from 'react';
import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js';
const baseClass = 'insert-paragraph-at-end';
export const InsertParagraphAtEndPlugin = () => {
  const $ = _c(2);
  const [editor] = useLexicalComposerContext();
  const {
    editorConfig
  } = useEditorConfigContext();
  if (editorConfig?.admin?.hideInsertParagraphAtEnd) {
    return null;
  }
  let t0;
  if ($[0] !== editor) {
    const onClick = () => {
      editor.update(_temp);
    };
    t0 = _jsx("div", {
      "aria-label": "Insert Paragraph",
      className: baseClass,
      onClick,
      role: "button",
      tabIndex: 0,
      children: _jsx("div", {
        className: `${baseClass}-inside`,
        children: _jsx("span", {
          children: "+"
        })
      })
    });
    $[0] = editor;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
};
function _temp() {
  const paragraphNode = $createParagraphNode();
  $getRoot().append(paragraphNode);
  paragraphNode.select();
}
//# sourceMappingURL=index.js.map