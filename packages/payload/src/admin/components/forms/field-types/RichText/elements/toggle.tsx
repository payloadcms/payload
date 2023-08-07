import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import isElementActive from './isActive';
import { isWithinListItem } from './isWithinListItem';

const toggleElement = (editor: Editor, format: string): void => {
  const isActive = isElementActive(editor, format);
  let type = format;

  const isWithinLI = isWithinListItem(editor);

  if (isActive) {
    type = undefined;
  }

  if (!isActive && isWithinLI) {
    const block = { type: 'li', children: [] };
    Transforms.wrapNodes(editor, block, {
      at: Editor.unhangRange(editor, editor.selection),
    });
  }

  Transforms.setNodes(editor, { type }, {
    at: Editor.unhangRange(editor, editor.selection),
  });

  ReactEditor.focus(editor);
};

export default toggleElement;
