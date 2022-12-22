import { Editor, Element, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import isListActive from './isListActive';
import listTypes from './listTypes';

const toggleList = (editor: Editor, format: string): void => {
  let currentListFormat: string;

  if (isListActive(editor, 'ol')) currentListFormat = 'ol';
  if (isListActive(editor, 'ul')) currentListFormat = 'ul';

  // If the format is currently active,
  // unwrap the list and set li type to undefined
  if (currentListFormat === format) {
    Transforms.unwrapNodes(editor, {
      match: (n) => Element.isElement(n) && listTypes.includes(n.type),
      mode: 'lowest',
    });

    Transforms.setNodes(editor, { type: undefined });

    // Otherwise, if a list is active and we are changing it,
    // change it
  } else if (currentListFormat !== format) {
    Transforms.setNodes(
      editor,
      {
        type: format,
      },
      {
        match: (node) => Element.isElement(node) && listTypes.includes(node.type),
        mode: 'lowest',
      },
    );
    // Otherwise we can assume that we should just activate the list
  } else {
    Transforms.setNodes(editor, { type: 'li' });
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }

  ReactEditor.focus(editor);
};

export default toggleList;
