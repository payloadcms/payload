/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {COMMAND_PRIORITY_NORMAL, PASTE_COMMAND} from 'lexical';
import * as React from 'react';
import {useEffect, useState} from 'react';

export default function PasteLogPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState(false);
  const [lastClipboardData, setLastClipboardData] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (isActive) {
      return editor.registerCommand(
        PASTE_COMMAND,
        (e: ClipboardEvent) => {
          const {clipboardData} = e;
          const allData: string[] = [];
          if (clipboardData && clipboardData.types) {
            clipboardData.types.forEach((type) => {
              allData.push(type.toUpperCase(), clipboardData.getData(type));
            });
          }
          setLastClipboardData(allData.join('\n\n'));
          return false;
        },
        COMMAND_PRIORITY_NORMAL,
      );
    }
  }, [editor, isActive]);
  return (
    <>
      <button
        id="paste-log-button"
        className={`editor-dev-button ${isActive ? 'active' : ''}`}
        onClick={() => {
          setIsActive(!isActive);
        }}
        title={isActive ? 'Disable paste log' : 'Enable paste log'}
      />
      {isActive && lastClipboardData !== null ? (
        <pre>{lastClipboardData}</pre>
      ) : null}
    </>
  );
}
