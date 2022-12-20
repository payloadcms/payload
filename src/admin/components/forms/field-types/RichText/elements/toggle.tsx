import { Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import isElementActive from './isActive';

const toggleElement = (editor, format) => {
  const isActive = isElementActive(editor, format);
  let type = format;

  if (isActive) {
    type = undefined;
  }

  Transforms.setNodes(editor, { type });

  ReactEditor.focus(editor);
};

export default toggleElement;
