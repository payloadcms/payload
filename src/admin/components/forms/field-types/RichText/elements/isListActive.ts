import { Ancestor, Editor, Element, NodeEntry } from 'slate';

const isListActive = (editor: Editor, format: string): boolean => {
  let parentLI: NodeEntry<Ancestor>;

  try {
    parentLI = Editor.parent(editor, editor.selection);
  } catch (e) {
    // swallow error, Slate
  }

  if (parentLI?.[1]?.length > 0) {
    const ancestor = Editor.above(editor, {
      at: parentLI[1],
    });

    return Element.isElement(ancestor[0]) && ancestor[0].type === format;
  }

  return false;
};

export default isListActive;
