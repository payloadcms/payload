import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from 'react';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, DRAGOVER_COMMAND,
  DRAGSTART_COMMAND, DROP_COMMAND, LexicalEditor
} from 'lexical';
import * as React from 'react';
import { $createImageNode, ImageNode } from '../../nodes/ImageNode';
import {
  INSERT_IMAGE_COMMAND,
  InsertImagePayload,
  InsertImageUploadedDialogBody,
  InsertImageUriDialogBody
} from '../ImagesPlugin';
import { DialogButtonsList } from '../../ui/Dialog';
import Button from '../../ui/Button';
import landscapeImage from '../../images/landscape.jpg';
import yellowFlowerImage from '../../images/yellow-flower.jpg';

import UploadElement from './Element';

export default function UploadPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [captionsEnabled, editor]);

  return null;
}


export function InsertUploadDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  return (
    <UploadElement attributes={undefined} children={undefined} element={undefined} path={undefined} fieldProps={undefined} />
  );
}
