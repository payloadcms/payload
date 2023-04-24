import { Editor, Node, NodeEntry, NodeMatch } from 'slate';
import { ElementNode } from '../types';

export const getCommonBlock = (editor: Editor, match?: NodeMatch<Node>): NodeEntry<Node> => {
  const range = Editor.unhangRange(editor, editor.selection, { voids: true });

  const [common, path] = Node.common(
    editor,
    range.anchor.path,
    range.focus.path,
  );

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (Editor.isBlock(editor, common) || Editor.isEditor(common)) {
    return [common, path];
  }

  return Editor.above(editor, {
    at: path,
    match: match || ((n: ElementNode) => Editor.isBlock(editor, n) || Editor.isEditor(n)),
  });
};
