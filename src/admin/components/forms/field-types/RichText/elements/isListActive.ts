import { Editor, Element } from 'slate';

const isListActive = (editor: Editor, format: string): boolean => {
  if (!editor.selection) return false;

  const parentLI = Editor.parent(editor, Editor.unhangRange(editor, editor.selection));

  const ancestor = Editor.above(editor, {
    at: parentLI[1],
  });

  return Element.isElement(ancestor[0]) && ancestor[0].type === format;
};

export default isListActive;
