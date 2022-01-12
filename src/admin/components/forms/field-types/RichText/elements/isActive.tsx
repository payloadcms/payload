import { Editor, Element } from 'slate';

const isElementActive = (editor, format) => {
  if (!editor.selection) return false;

  const [match] = Array.from(Editor.nodes(editor, {
    at: Editor.unhangRange(editor, editor.selection),
    match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === format,
  }));

  return !!match;
};

export default isElementActive;
