'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TEXT_TYPE_TO_FORMAT, TextNode } from 'lexical';
import { useEffect } from 'react';
export function TextPlugin(t0) {
  const $ = _c(6);
  const {
    features
  } = t0;
  const [editor] = useLexicalComposerContext();
  let t1;
  if ($[0] !== editor || $[1] !== features.enabledFormats) {
    t1 = () => {
      const disabledFormats = getDisabledFormats(features.enabledFormats);
      if (disabledFormats.length === 0) {
        return;
      }
      return editor.registerNodeTransform(TextNode, textNode => {
        disabledFormats.forEach(disabledFormat => {
          if (textNode.hasFormat(disabledFormat)) {
            textNode.toggleFormat(disabledFormat);
          }
        });
      });
    };
    $[0] = editor;
    $[1] = features.enabledFormats;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== editor || $[4] !== features) {
    t2 = [editor, features];
    $[3] = editor;
    $[4] = features;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  useEffect(t1, t2);
  return null;
}
function getDisabledFormats(enabledFormats) {
  const allFormats = Object.keys(TEXT_TYPE_TO_FORMAT);
  const enabledSet = new Set(enabledFormats);
  return allFormats.filter(format => !enabledSet.has(format));
}
//# sourceMappingURL=index.js.map