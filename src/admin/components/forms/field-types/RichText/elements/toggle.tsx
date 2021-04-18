import { Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import isElementActive from './isActive';
import listTypes from './listTypes';

const toggleElement = (editor, format) => {
  const isActive = isElementActive(editor, format);
  const isList = listTypes.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) => listTypes.includes(n.type as string),
    split: true,
  });

  let type = format;

  if (isActive) {
    type = 'p';
  } else if (isList) {
    type = 'li';
  }

  if (editor.blurSelection) {
    Transforms.select(editor, editor.blurSelection);
  }

  Transforms.setNodes(editor, { type });

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }

  ReactEditor.focus(editor);
};

export default toggleElement;
