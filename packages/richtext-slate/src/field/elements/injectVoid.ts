import type { Element } from 'slate'

import { Editor, Transforms } from 'slate'

import type { ElementNode } from '../../types.js'

import { isLastSelectedElementEmpty } from './isLastSelectedElementEmpty.js'

export const injectVoidElement = (editor: Editor, element: Element): void => {
  const lastSelectedElementIsEmpty = isLastSelectedElementEmpty(editor)
  const previous = Editor.previous<ElementNode>(editor)

  if (lastSelectedElementIsEmpty) {
    // If previous node is void
    if (previous?.[0] && Editor.isVoid(editor, previous[0])) {
      // Insert a blank element between void nodes
      // so user can place cursor between void nodes
      Transforms.insertNodes(editor, { children: [{ text: '' }] })
      Transforms.setNodes(editor, element)
      // Otherwise just set the empty node equal to new void
    } else {
      Transforms.setNodes(editor, element)
    }
  } else {
    Transforms.insertNodes(editor, element)
  }

  // Add an empty node after the new void
  Transforms.insertNodes(editor, { children: [{ text: '' }] })
}
