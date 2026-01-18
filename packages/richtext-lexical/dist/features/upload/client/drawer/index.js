'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { toast } from '@payloadcms/ui';
import { $getNodeByKey, COMMAND_PRIORITY_EDITOR } from 'lexical';
import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalListDrawer } from '../../../../utilities/fieldsDrawer/useLexicalListDrawer.js';
import { $createUploadNode } from '../nodes/UploadNode.js';
import { INSERT_UPLOAD_COMMAND } from '../plugin/index.js';
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from './commands.js';
const insertUpload = ({
  editor,
  relationTo,
  replaceNodeKey,
  value
}) => {
  if (!replaceNodeKey) {
    editor.dispatchCommand(INSERT_UPLOAD_COMMAND, {
      // @ts-expect-error - TODO: fix this
      fields: null,
      relationTo,
      value
    });
  } else {
    editor.update(() => {
      const node = $getNodeByKey(replaceNodeKey);
      if (node) {
        node.replace($createUploadNode({
          data: {
            // @ts-expect-error - TODO: fix this
            fields: null,
            relationTo,
            value
          }
        }));
      }
    });
  }
};
const UploadDrawerComponent = t0 => {
  const $ = _c(13);
  const {
    enabledCollectionSlugs
  } = t0;
  const [editor] = useLexicalComposerContext();
  const [replaceNodeKey, setReplaceNodeKey] = useState(null);
  let t1;
  if ($[0] !== enabledCollectionSlugs) {
    t1 = {
      collectionSlugs: enabledCollectionSlugs,
      uploads: true
    };
    $[0] = enabledCollectionSlugs;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const {
    closeListDrawer,
    ListDrawer,
    openListDrawer
  } = useLexicalListDrawer(t1);
  let t2;
  let t3;
  if ($[2] !== editor || $[3] !== openListDrawer) {
    t2 = () => editor.registerCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, payload => {
      setReplaceNodeKey(payload?.replace ? payload?.replace.nodeKey : null);
      openListDrawer();
      return true;
    }, COMMAND_PRIORITY_EDITOR);
    t3 = [editor, openListDrawer];
    $[2] = editor;
    $[3] = openListDrawer;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  useEffect(t2, t3);
  let t4;
  if ($[6] !== closeListDrawer || $[7] !== editor || $[8] !== replaceNodeKey) {
    t4 = t5 => {
      const {
        collectionSlug,
        doc
      } = t5;
      closeListDrawer();
      insertUpload({
        editor,
        relationTo: collectionSlug,
        replaceNodeKey,
        value: doc.id
      });
    };
    $[6] = closeListDrawer;
    $[7] = editor;
    $[8] = replaceNodeKey;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const onSelect = t4;
  let t5;
  if ($[10] !== ListDrawer || $[11] !== onSelect) {
    t5 = _jsx(ListDrawer, {
      onSelect
    });
    $[10] = ListDrawer;
    $[11] = onSelect;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  return t5;
};
const UploadDrawerComponentFallback = () => {
  const $ = _c(3);
  const [editor] = useLexicalComposerContext();
  let t0;
  let t1;
  if ($[0] !== editor) {
    t0 = () => editor.registerCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, _temp, COMMAND_PRIORITY_EDITOR);
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
export const UploadDrawer = ({
  enabledCollectionSlugs
}) => {
  if (!enabledCollectionSlugs?.length) {
    return /*#__PURE__*/_jsx(UploadDrawerComponentFallback, {});
  }
  return /*#__PURE__*/_jsx(UploadDrawerComponent, {
    enabledCollectionSlugs: enabledCollectionSlugs
  });
};
function _temp() {
  toast.error("No upload collections enabled");
  return true;
}
//# sourceMappingURL=index.js.map