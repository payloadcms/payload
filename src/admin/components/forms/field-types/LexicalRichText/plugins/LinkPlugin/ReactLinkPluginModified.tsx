/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { LinkNode, TOGGLE_LINK_COMMAND, toggleLink } from './LinkPluginModified';
import type { PayloadLinkData } from './LinkPluginModified';

type Props = {
  validateUrl?: (url: string) => boolean;
};

export function LinkPlugin({ validateUrl }: Props): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([LinkNode])) {
      throw new Error('LinkPlugin: LinkNode not registered on editor');
    }
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_LINK_COMMAND,
        (payload) => {
          console.log('Payload received:', payload);
          let linkData: PayloadLinkData = {
            url: null,
            doc: null,
            linkType: 'custom',
            newTab: false,
          };

          if (payload === null) {
            linkData = null;
          } else if (typeof payload === 'string') {
            if (validateUrl === undefined || validateUrl(payload)) {
              linkData.url = payload;
            } else {
              return false;
            }
          } else if (payload.payloadType && payload.payloadType === 'payload') {
            const receivedLinkData: PayloadLinkData = payload as PayloadLinkData;
            linkData.linkType = receivedLinkData.linkType;
            linkData.newTab = receivedLinkData.newTab;
            linkData.fields = receivedLinkData.fields;
            if (receivedLinkData.linkType === 'custom') { // Just a simple URL! No doc
              if (validateUrl === undefined || validateUrl(receivedLinkData.url)) {
                linkData.url = receivedLinkData.url;
              } else {
                return false;
              }
            } else if (receivedLinkData.linkType === 'internal') {
              linkData.doc = receivedLinkData.doc;
              if (!linkData.doc) {
                linkData = null;
              }
            } else {
              return false;
            }
          } else {
            return false;
          }

          toggleLink(linkData);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      validateUrl !== undefined
        ? editor.registerCommand(
          PASTE_COMMAND,
          (event) => {
            const selection = $getSelection();
            if (
              !$isRangeSelection(selection)
              || selection.isCollapsed()
              || !(event instanceof ClipboardEvent)
              || event.clipboardData == null
            ) {
              return false;
            }
            const clipboardText = event.clipboardData.getData('text');
            if (!validateUrl(clipboardText)) {
              return false;
            }
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, clipboardText);
            event.preventDefault();
            return true;
          },
          COMMAND_PRIORITY_LOW,
        )
        : () => {
          // Don't paste arbritrary text as a link when there's no validate function
        },
    );
  }, [editor, validateUrl]);

  return null;
}
