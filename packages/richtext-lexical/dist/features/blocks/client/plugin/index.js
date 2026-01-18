'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $insertNodeToNearestRoot, $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import { formatDrawerSlug, useEditDepth } from '@payloadcms/ui';
import { $createParagraphNode, $getNodeByKey, $getPreviousSelection, $getSelection, $insertNodes, $isParagraphNode, $isRangeSelection, $isRootOrShadowRoot, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect, useState } from 'react';
import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js';
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js';
import { $createBlockNode, BlockNode } from '../nodes/BlocksNode.js';
import { $createInlineBlockNode, $isInlineBlockNode } from '../nodes/InlineBlocksNode.js';
import { INSERT_BLOCK_COMMAND, INSERT_INLINE_BLOCK_COMMAND } from './commands.js';
export const BlocksPlugin = () => {
  const $ = _c(12);
  const [editor] = useLexicalComposerContext();
  const [targetNodeKey, setTargetNodeKey] = useState(null);
  const {
    setCreatedInlineBlock,
    uuid
  } = useEditorConfigContext();
  const editDepth = useEditDepth();
  const t0 = "lexical-inlineBlocks-create-" + uuid;
  let t1;
  if ($[0] !== editDepth || $[1] !== t0) {
    t1 = formatDrawerSlug({
      slug: t0,
      depth: editDepth
    });
    $[0] = editDepth;
    $[1] = t0;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const drawerSlug = t1;
  const {
    toggleDrawer
  } = useLexicalDrawer(drawerSlug, true);
  let t2;
  if ($[3] !== editor || $[4] !== setCreatedInlineBlock || $[5] !== targetNodeKey) {
    t2 = () => {
      if (!editor.hasNodes([BlockNode])) {
        throw new Error("BlocksPlugin: BlocksNode not registered on editor");
      }
      return mergeRegister(editor.registerCommand(INSERT_BLOCK_COMMAND, payload => {
        editor.update(() => {
          const selection = $getSelection() || $getPreviousSelection();
          if ($isRangeSelection(selection)) {
            const blockNode = $createBlockNode(payload);
            const {
              focus
            } = selection;
            const focusNode = focus.getNode();
            $insertNodeToNearestRoot(blockNode);
            if ($isParagraphNode(focusNode) && !focusNode.__first) {
              focusNode.remove();
            }
          }
        });
        return true;
      }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(INSERT_INLINE_BLOCK_COMMAND, fields => {
        if (targetNodeKey) {
          const node = $getNodeByKey(targetNodeKey);
          if (!node || !$isInlineBlockNode(node)) {
            return false;
          }
          node.setFields(fields);
          setTargetNodeKey(null);
          return true;
        }
        const inlineBlockNode = $createInlineBlockNode(fields);
        setCreatedInlineBlock?.(inlineBlockNode);
        $insertNodes([inlineBlockNode]);
        if ($isRootOrShadowRoot(inlineBlockNode.getParentOrThrow())) {
          $wrapNodeInElement(inlineBlockNode, $createParagraphNode).selectEnd();
        }
        return true;
      }, COMMAND_PRIORITY_EDITOR));
    };
    $[3] = editor;
    $[4] = setCreatedInlineBlock;
    $[5] = targetNodeKey;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  let t3;
  if ($[7] !== editor || $[8] !== setCreatedInlineBlock || $[9] !== targetNodeKey || $[10] !== toggleDrawer) {
    t3 = [editor, setCreatedInlineBlock, targetNodeKey, toggleDrawer];
    $[7] = editor;
    $[8] = setCreatedInlineBlock;
    $[9] = targetNodeKey;
    $[10] = toggleDrawer;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  useEffect(t2, t3);
  return null;
};
//# sourceMappingURL=index.js.map