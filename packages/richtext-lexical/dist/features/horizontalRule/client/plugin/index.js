'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '../../server/nodes/HorizontalRuleNode.js';
import { $createHorizontalRuleNode } from '../nodes/HorizontalRuleNode.js';
/**
 * Registers the INSERT_HORIZONTAL_RULE_COMMAND lexical command and defines the behavior for when it is called.
 */
export const HorizontalRulePlugin = () => {
  const $ = _c(3);
  const [editor] = useLexicalComposerContext();
  let t0;
  let t1;
  if ($[0] !== editor) {
    t0 = () => editor.registerCommand(INSERT_HORIZONTAL_RULE_COMMAND, _temp, COMMAND_PRIORITY_EDITOR);
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
};
function _temp(type) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const focusNode = selection.focus.getNode();
  if (focusNode !== null) {
    const horizontalRuleNode = $createHorizontalRuleNode();
    $insertNodeToNearestRoot(horizontalRuleNode);
  }
  return true;
}
//# sourceMappingURL=index.js.map