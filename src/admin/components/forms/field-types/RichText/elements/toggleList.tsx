import { Editor, Element, Node, Text, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { getCommonBlock } from './getCommonBlock';
import isListActive from './isListActive';
import listTypes from './listTypes';
import { unwrapList } from './unwrapList';

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
      unwrapList(editor, listPath);
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
    Transforms.wrapNodes(editor, { type: format, children: [] });

    const [, parentNodePath] = getCommonBlock(editor, (node) => Element.isElement(node) && node.type === format);

    // Only set li on nodes that don't have type
    Transforms.setNodes(editor, { type: 'li' }, {
      voids: true,
      match: (node, path) => {
        const match = Element.isElement(node)
          && typeof node.type === 'undefined'
          && path.length === parentNodePath.length + 1;

        return match;
      },
    });

    // Wrap nodes that do have a type with an li
    // so as to not lose their existing formatting
    const nodesToWrap = Array.from(Editor.nodes(editor, {
      match: (node, path) => {
        const match = Element.isElement(node)
          && typeof node.type !== 'undefined'
          && node.type !== 'li'
          && path.length === parentNodePath.length + 1;

        return match;
      },
    }));

    nodesToWrap.forEach(([, path]) => {
      Transforms.wrapNodes(editor, { type: 'li', children: [] }, { at: path });
    });
  }

  ReactEditor.focus(editor);
};

export default toggleList;
