/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot} from '@lexical/utils';
import {COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand} from 'lexical';
import {useEffect} from 'react';

import {$createFigmaNode, FigmaNode} from '../../nodes/FigmaNode';

export const INSERT_FIGMA_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_FIGMA_COMMAND',
);

export default function FigmaPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([FigmaNode])) {
      throw new Error('FigmaPlugin: FigmaNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_FIGMA_COMMAND,
      (payload) => {
        const figmaNode = $createFigmaNode(payload);
        $insertNodeToNearestRoot(figmaNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
