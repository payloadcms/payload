import { Editor, Element, Transforms } from 'slate';
import { isLastSelectedElementEmpty } from './isLastSelectedElementEmpty';

export const injectVoidElement = (editor: Editor, element: Element): void => {
  const lastSelectedElementIsEmpty = isLastSelectedElementEmpty(editor);
  const previous = Editor.previous(editor);

  if (lastSelectedElementIsEmpty) {
    // If previous node is void
    if (Editor.isVoid(editor, previous?.[0])) {
      // Insert a blank element between void nodes
      // so user can place cursor between void nodes
      Transforms.insertNodes(editor, { children: [{ text: '' }] });
      Transforms.setNodes(editor, element);
    // Otherwise just set the empty node equal to new upload
    } else {
      Transforms.setNodes(editor, element);
    }

    // Add an empty node after the new upload
    Transforms.insertNodes(editor, { children: [{ text: '' }] });
  } else {
    Transforms.insertNodes(editor, [element, { children: [{ text: '' }] }]);
  }
};
