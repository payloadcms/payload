import { Editor, Node, NodeEntry, NodeMatch } from 'slate';
import { ElementNode } from '../types';
import { isBlockElement } from './isBlockElement';

export const getCommonBlock = (editor: Editor, match?: NodeMatch<Node>): NodeEntry<Node> => {
  const range = Editor.unhangRange(editor, editor.selection, { voids: true });

  const [common, path] = Node.common(
    editor,
    range.anchor.path,
    range.focus.path,
  );

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (isBlockElement(editor, common) || Editor.isEditor(common)) {
    return [common, path];
  }


  return Editor.above(editor, {
    at: path,
    match: match || ((n: ElementNode) => isBlockElement(editor, n) || Editor.isEditor(n)),
  });
};
