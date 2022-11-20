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
import { LinkNode, PayloadLinkData, TOGGLE_LINK_COMMAND, toggleLink, toggleLinkPayload } from './LinkPluginModified';

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
          if (payload === null) {
            toggleLink(payload);
            return true;
          } if (typeof payload === 'string') {
            if (validateUrl === undefined || validateUrl(payload)) {
              toggleLink(payload);
              return true;
            }
            return false;
          } if (payload.type && payload.type === 'payload') {
            console.log('Payload type!', payload);
            // DO PAYLOAD SHIT
            const payloadLinkData: PayloadLinkData = payload as PayloadLinkData;
            if (payloadLinkData.url) { // Just a simple URL! No doc
              if (validateUrl === undefined || validateUrl(payloadLinkData.url)) {
                const target = (payloadLinkData.newTab ? '_BLANK' : undefined);
                toggleLink(payloadLinkData.url, { rel: undefined, target });
                return true;
              }
              toggleLinkPayload(payloadLinkData);
              return true;
            } // internal linking where I have a doc
            return false;
          }
          const { url, target, rel } = payload;
          toggleLink(url, { rel, target });
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
