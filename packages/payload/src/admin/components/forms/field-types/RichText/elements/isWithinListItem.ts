import type { Ancestor, NodeEntry } from 'slate'

import { Editor, Element } from 'slate'

export const isWithinListItem = (editor: Editor): boolean => {
  let parentLI: NodeEntry<Ancestor>

  try {
    parentLI = Editor.parent(editor, editor.selection)
  } catch (e) {
    // swallow error, Slate
  }

  if (Element.isElement(parentLI?.[0]) && parentLI?.[0]?.type === 'li') {
    return true
  }

  return false
}
