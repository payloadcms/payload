import { Editor, Element } from 'slate';

const isListActive = (editor: Editor, format: string): boolean => {
  if (!editor.selection
    // If focus or anchor is at root of editor,
    // Return false - as Editor.parent will fail
    || editor.selection.focus.path[1] === 0
    || editor.selection.anchor.path[1] === 0
  ) return false;

  const parentLI = Editor.parent(editor, editor.selection);

  if (parentLI[1].length > 0) {
    const ancestor = Editor.above(editor, {
      at: parentLI[1],
    });

    return Element.isElement(ancestor[0]) && ancestor[0].type === format;
  }

  return false;
};

export default isListActive;
