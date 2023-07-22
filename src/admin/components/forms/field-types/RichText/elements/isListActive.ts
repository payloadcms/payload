import { Editor, Element } from 'slate';
import { getCommonBlock } from './getCommonBlock';

const isListActive = (editor: Editor, format: string): boolean => {
  if (!editor.selection) return false;
  const [topmostSelectedNode, topmostSelectedNodePath] = getCommonBlock(editor);

  if (Editor.isEditor(topmostSelectedNode)) return false;

  const [match] = Array.from(Editor.nodes(editor, {
    at: topmostSelectedNodePath,
    mode: 'lowest',
    match: (node, path) => {
      return !Editor.isEditor(node)
        && Element.isElement(node)
        && node.type === format
        && path.length >= topmostSelectedNodePath.length - 2;
    },
  }));

  return !!match;
};

export default isListActive;
