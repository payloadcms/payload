'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isElementNode, $isRangeSelection, COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical';
import { useEffect } from 'react';
import { validateUrl } from '../../../../../lexical/utils/url.js';
import { $toggleLink, LinkNode, TOGGLE_LINK_COMMAND } from '../../../nodes/LinkNode.js';
export const LinkPlugin = t0 => {
  const $ = _c(5);
  const {
    clientProps
  } = t0;
  const [editor] = useLexicalComposerContext();
  let t1;
  let t2;
  if ($[0] !== clientProps.defaultLinkType || $[1] !== clientProps.defaultLinkURL || $[2] !== editor) {
    t1 = () => {
      if (!editor.hasNodes([LinkNode])) {
        throw new Error("LinkPlugin: LinkNode not registered on editor");
      }
      return mergeRegister(editor.registerCommand(TOGGLE_LINK_COMMAND, payload => {
        if (payload === null) {
          $toggleLink(null);
          return true;
        }
        if (!payload.fields?.linkType) {
          payload.fields.linkType = clientProps.defaultLinkType;
        }
        if (!payload.fields?.url) {
          payload.fields.url = clientProps.defaultLinkURL;
        }
        $toggleLink(payload);
        return true;
      }, COMMAND_PRIORITY_LOW), editor.registerCommand(PASTE_COMMAND, event => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed() || !(event instanceof ClipboardEvent) || event.clipboardData == null) {
          return false;
        }
        const clipboardText = event.clipboardData.getData("text");
        if (!validateUrl(clipboardText)) {
          return false;
        }
        if (!selection.getNodes().some(_temp)) {
          const linkFields = {
            doc: null,
            linkType: "custom",
            newTab: false,
            url: clipboardText
          };
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
            fields: linkFields,
            text: null
          });
          event.preventDefault();
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW));
    };
    t2 = [clientProps.defaultLinkType, clientProps.defaultLinkURL, editor];
    $[0] = clientProps.defaultLinkType;
    $[1] = clientProps.defaultLinkURL;
    $[2] = editor;
    $[3] = t1;
    $[4] = t2;
  } else {
    t1 = $[3];
    t2 = $[4];
  }
  useEffect(t1, t2);
  return null;
};
function _temp(node) {
  return $isElementNode(node);
}
//# sourceMappingURL=index.js.map