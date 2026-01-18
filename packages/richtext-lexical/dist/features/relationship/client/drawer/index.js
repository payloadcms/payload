'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { toast } from '@payloadcms/ui';
import { $getNodeByKey, COMMAND_PRIORITY_EDITOR } from 'lexical';
import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalListDrawer } from '../../../../utilities/fieldsDrawer/useLexicalListDrawer.js';
import { $createRelationshipNode } from '../nodes/RelationshipNode.js';
import { INSERT_RELATIONSHIP_COMMAND } from '../plugins/index.js';
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './commands.js';
const insertRelationship = ({
  editor,
  relationTo,
  replaceNodeKey,
  value
}) => {
  if (!replaceNodeKey) {
    editor.dispatchCommand(INSERT_RELATIONSHIP_COMMAND, {
      relationTo,
      value
    });
  } else {
    editor.update(() => {
      const node = $getNodeByKey(replaceNodeKey);
      if (node) {
        node.replace($createRelationshipNode({
          relationTo,
          value
        }));
      }
    });
  }
};
const RelationshipDrawerComponent = t0 => {
  const $ = _c(14);
  const {
    enabledCollectionSlugs
  } = t0;
  const [editor] = useLexicalComposerContext();
  const [replaceNodeKey, setReplaceNodeKey] = useState(null);
  const t1 = enabledCollectionSlugs?.[0];
  let t2;
  if ($[0] !== enabledCollectionSlugs || $[1] !== t1) {
    t2 = {
      collectionSlugs: enabledCollectionSlugs,
      selectedCollection: t1
    };
    $[0] = enabledCollectionSlugs;
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const {
    closeListDrawer,
    ListDrawer,
    openListDrawer
  } = useLexicalListDrawer(t2);
  let t3;
  let t4;
  if ($[3] !== editor || $[4] !== openListDrawer) {
    t3 = () => editor.registerCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, payload => {
      setReplaceNodeKey(payload?.replace ? payload?.replace.nodeKey : null);
      openListDrawer();
      return true;
    }, COMMAND_PRIORITY_EDITOR);
    t4 = [editor, openListDrawer];
    $[3] = editor;
    $[4] = openListDrawer;
    $[5] = t3;
    $[6] = t4;
  } else {
    t3 = $[5];
    t4 = $[6];
  }
  useEffect(t3, t4);
  let t5;
  if ($[7] !== closeListDrawer || $[8] !== editor || $[9] !== replaceNodeKey) {
    t5 = t6 => {
      const {
        collectionSlug,
        doc
      } = t6;
      insertRelationship({
        editor,
        relationTo: collectionSlug,
        replaceNodeKey,
        value: doc.id
      });
      closeListDrawer();
    };
    $[7] = closeListDrawer;
    $[8] = editor;
    $[9] = replaceNodeKey;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const onSelect = t5;
  let t6;
  if ($[11] !== ListDrawer || $[12] !== onSelect) {
    t6 = _jsx(ListDrawer, {
      onSelect
    });
    $[11] = ListDrawer;
    $[12] = onSelect;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  return t6;
};
const RelationshipDrawerComponentFallback = () => {
  const $ = _c(3);
  const [editor] = useLexicalComposerContext();
  let t0;
  let t1;
  if ($[0] !== editor) {
    t0 = () => editor.registerCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, _temp, COMMAND_PRIORITY_EDITOR);
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
export const RelationshipDrawer = ({
  enabledCollectionSlugs
}) => {
  if (!enabledCollectionSlugs?.length) {
    return /*#__PURE__*/_jsx(RelationshipDrawerComponentFallback, {});
  }
  return /*#__PURE__*/_jsx(RelationshipDrawerComponent, {
    enabledCollectionSlugs: enabledCollectionSlugs
  });
};
function _temp() {
  toast.error("No relationship collections enabled");
  return true;
}
//# sourceMappingURL=index.js.map