'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { $getPreviousSelection, $getSelection, $isParagraphNode, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { useEffect } from 'react';
import { RelationshipDrawer } from '../drawer/index.js';
import { $createRelationshipNode, RelationshipNode } from '../nodes/RelationshipNode.js';
import { useEnabledRelationships } from '../utils/useEnabledRelationships.js';
export const INSERT_RELATIONSHIP_COMMAND = createCommand('INSERT_RELATIONSHIP_COMMAND');
export const RelationshipPlugin = t0 => {
  const $ = _c(8);
  const {
    clientProps
  } = t0;
  const [editor] = useLexicalComposerContext();
  const t1 = clientProps?.disabledCollections;
  const t2 = clientProps?.enabledCollections;
  let t3;
  if ($[0] !== t1 || $[1] !== t2) {
    t3 = {
      collectionSlugsBlacklist: t1,
      collectionSlugsWhitelist: t2
    };
    $[0] = t1;
    $[1] = t2;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  const {
    enabledCollectionSlugs
  } = useEnabledRelationships(t3);
  let t4;
  let t5;
  if ($[3] !== editor) {
    t4 = () => {
      if (!editor.hasNodes([RelationshipNode])) {
        throw new Error("RelationshipPlugin: RelationshipNode not registered on editor");
      }
      return editor.registerCommand(INSERT_RELATIONSHIP_COMMAND, _temp, COMMAND_PRIORITY_EDITOR);
    };
    t5 = [editor];
    $[3] = editor;
    $[4] = t4;
    $[5] = t5;
  } else {
    t4 = $[4];
    t5 = $[5];
  }
  useEffect(t4, t5);
  let t6;
  if ($[6] !== enabledCollectionSlugs) {
    t6 = _jsx(RelationshipDrawer, {
      enabledCollectionSlugs
    });
    $[6] = enabledCollectionSlugs;
    $[7] = t6;
  } else {
    t6 = $[7];
  }
  return t6;
};
function _temp(payload) {
  const selection = $getSelection() || $getPreviousSelection();
  if ($isRangeSelection(selection)) {
    const relationshipNode = $createRelationshipNode(payload);
    const {
      focus
    } = selection;
    const focusNode = focus.getNode();
    $insertNodeToNearestRoot(relationshipNode);
    if ($isParagraphNode(focusNode) && !focusNode.__first) {
      focusNode.remove();
    }
  }
  return true;
}
//# sourceMappingURL=index.js.map