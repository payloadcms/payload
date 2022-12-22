import { Editor, Element, Node, Text, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { getCommonBlock } from './getCommonBlock';
import isListActive from './isListActive';
import listTypes from './listTypes';

const toggleList = (editor: Editor, format: string): void => {
  let currentListFormat: string;

  if (isListActive(editor, 'ol')) currentListFormat = 'ol';
  if (isListActive(editor, 'ul')) currentListFormat = 'ul';

  // If the format is currently active,
  // remove the list
  if (currentListFormat === format) {
    const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path);

    // If on an empty bullet, leave the above list alone
    // and unwrap only the active bullet
    if (Text.isText(selectedLeaf) && String(selectedLeaf.text).length === 0) {
      Transforms.unwrapNodes(editor, {
        match: (n) => Element.isElement(n) && listTypes.includes(n.type),
        split: true,
        mode: 'lowest',
      });

      Transforms.setNodes(editor, { type: undefined });
    } else {
      // Otherwise, we need to unset li on all lis in the parent list
      // and unwrap the parent list itself
      const [, listPath] = getCommonBlock(editor, (n) => Element.isElement(n) && n.type === format);

      // Remove type for any nodes that have more than one child
      Transforms.setNodes(editor, { type: undefined }, {
        at: listPath,
        match: (node, path) => {
          const matches = !Editor.isEditor(node)
            && Element.isElement(node)
            && node.children.length === 1
            && node.type === 'li'
            && path.length === listPath.length + 1;

          return matches;
        },
      });

      // For nodes that have more than one child, unwrap it instead
      Transforms.unwrapNodes(editor, {
        at: listPath,
        match: (node, path) => {
          const matches = !Editor.isEditor(node)
            && Element.isElement(node)
            && node.children.length > 1
            && node.type === 'li'
            && path.length === listPath.length + 1;

          return matches;
        },
      });

      // Finally, unwrap the UL itself
      Transforms.unwrapNodes(editor, {
        match: (n) => Element.isElement(n) && n.type === format,
        mode: 'lowest',
      });
    }

    // Otherwise, if a list is active and we are changing it,
    // change it
  } else if (currentListFormat && currentListFormat !== format) {
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
