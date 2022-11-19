/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'katex/dist/katex.css';
import './modal.scss';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import { useCallback, useEffect } from 'react';
import * as React from 'react';

import { useModal } from '@faceless-ui/modal';
import { $createEquationNode, EquationNode } from '../../nodes/EquationNode';
import KatexEquationAlterer from '../../ui/KatexEquationAlterer';
import MinimalTemplate from '../../../../../templates/Minimal';
import Button from '../../../../../elements/Button';
import TextInput from '../../ui/TextInput';
import { DialogActions } from '../../ui/Dialog';

type CommandPayload = {
  equation: string;
  inline: boolean;
};

export const INSERT_EQUATION_COMMAND: LexicalCommand<CommandPayload> = createCommand('INSERT_EQUATION_COMMAND');

export function InsertEquationDialog({
  activeEditor,
}: {
  activeEditor: LexicalEditor;
}): JSX.Element {

  const {
    toggleModal,
  } = useModal();
  const modalSlug = 'lexicalRichText-add-equation';
  const baseModalClass = 'rich-text-equation-modal';

  const onEquationConfirm = useCallback(
    (equation: string, inline: boolean) => {
      activeEditor.dispatchCommand(INSERT_EQUATION_COMMAND, { equation, inline });
      toggleModal(modalSlug);
    },
    [activeEditor/* , onClose */],
  );

  return (
    <React.Fragment>
      <MinimalTemplate width="wide">
        <header className={`${baseModalClass}__header`}>
          <h1>
            Add equation
          </h1>
          <Button
            icon="x"
            round
            buttonStyle="icon-label"
            iconStyle="with-border"
            onClick={() => {
              toggleModal(modalSlug);
            }}
          />
        </header>
        <KatexEquationAlterer onConfirm={onEquationConfirm} />
      </MinimalTemplate>
    </React.Fragment>
  );

}

export default function EquationsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EquationNode])) {
      throw new Error(
        'EquationsPlugins: EquationsNode not registered on editor',
      );
    }

    return editor.registerCommand<CommandPayload>(
      INSERT_EQUATION_COMMAND,
      (payload) => {
        const { equation, inline } = payload;
        const equationNode = $createEquationNode(equation, inline);

        $insertNodes([equationNode]);
        if ($isRootOrShadowRoot(equationNode.getParentOrThrow())) {
          $wrapNodeInElement(equationNode, $createParagraphNode).selectEnd();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
