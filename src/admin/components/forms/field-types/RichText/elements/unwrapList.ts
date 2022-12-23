import { Path, Transforms, Editor, Element } from 'slate';
import listTypes from './listTypes';

export const unwrapList = (editor: Editor, atPath: Path): void => {
  // Remove type for any nodes that have only one child -
  // this means that the node should remain
  Transforms.setNodes(editor, { type: undefined }, {
    at: atPath,
    match: (node, path) => {
      const matches = !Editor.isEditor(node)
        && Element.isElement(node)
        && node.children.length === 1
        && node.type === 'li'
        && path.length === atPath.length + 1;

      return matches;
    },
  });

  // For nodes that have more than one child, unwrap it instead
  // because the li is a duplicative wrapper
  Transforms.unwrapNodes(editor, {
    at: atPath,
    match: (node, path) => {
      const matches = !Editor.isEditor(node)
        && Element.isElement(node)
        && node.children.length > 1
        && node.type === 'li'
        && path.length === atPath.length + 1;

      return matches;
    },
  });

  // Finally, unwrap the UL itself
  Transforms.unwrapNodes(editor, {
    match: (n) => Element.isElement(n) && listTypes.includes(n.type),
    mode: 'lowest',
  });
};
