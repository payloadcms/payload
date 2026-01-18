'use client';

import { c as _c } from "react/compiler-runtime";
import { copyToClipboard } from '@lexical/clipboard';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { objectKlassEquals } from '@lexical/utils';
import ObjectID from 'bson-objectid';
import { $getSelection, $isNodeSelection, COMMAND_PRIORITY_LOW, COPY_COMMAND } from 'lexical';
import { useEffect } from 'react';
const changeIds = node => {
  if ('fields' in node && typeof node.fields === 'object' && node.fields !== null && 'id' in node.fields) {
    node.fields.id = new ObjectID.default().toHexString();
  } else if ('id' in node) {
    node.id = new ObjectID.default().toHexString();
  }
  if (node.children) {
    for (const child of node.children) {
      changeIds(child);
    }
  }
};
export function ClipboardPlugin() {
  const $ = _c(3);
  const [editor] = useLexicalComposerContext();
  let t0;
  let t1;
  if ($[0] !== editor) {
    t0 = () => editor.registerCommand(COPY_COMMAND, event => {
      const selection = $getSelection();
      if ($isNodeSelection(selection)) {
        const node = selection.getNodes()[0];
        const serializedNode = node?.exportJSON();
        const deepCloneSerializedNode = JSON.parse(JSON.stringify(serializedNode));
        changeIds(deepCloneSerializedNode);
        const lexicalClipboardData = {
          namespace: editor._config.namespace,
          nodes: [deepCloneSerializedNode]
        };
        const stringifiedLexicalClipboardData = JSON.stringify(lexicalClipboardData);
        copyToClipboard(editor, null, {
          "application/x-lexical-editor": stringifiedLexicalClipboardData,
          "text/plain": ""
        }).catch(_temp);
        return true;
      }
      copyToClipboard(editor, objectKlassEquals(event, ClipboardEvent) ? event : null).then(() => {
        if (!(event instanceof ClipboardEvent) || !event.clipboardData) {
          throw new Error("No clipboard event");
        }
        const lexicalStringified = event.clipboardData.getData("application/x-lexical-editor");
        if (!lexicalStringified) {
          return true;
        }
        const lexical = JSON.parse(lexicalStringified);
        for (const node_0 of lexical.nodes) {
          changeIds(node_0);
        }
        const stringified = JSON.stringify(lexical);
        event.clipboardData.setData("application/x-lexical-editor", stringified);
      }).catch(error_0 => {
        if (event instanceof ClipboardEvent) {
          event.clipboardData?.setData("application/x-lexical-editor", "");
        }
        throw error_0;
      });
      return true;
    }, COMMAND_PRIORITY_LOW);
    t1 = [editor];
    $[0] = editor;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useEffect(t0, t1);
  return null;
}
function _temp(error) {
  throw error;
}
//# sourceMappingURL=index.js.map