import { Editor, Element } from 'slate'

import { nodeIsTextNode } from '../../types.js'

export const isLastSelectedElementEmpty = (editor: Editor): boolean => {
  if (!editor.selection) {
    return false
  }

  const currentlySelectedNodes = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, editor.selection),
      match: (n) => !Editor.isEditor(n) && Element.isElement(n) && (!n.type || n.type === 'p'),
    }),
  )

  const lastSelectedNode = currentlySelectedNodes?.[currentlySelectedNodes?.length - 1]

  return (
    lastSelectedNode &&
    Element.isElement(lastSelectedNode[0]) &&
    (!lastSelectedNode[0].type || lastSelectedNode[0].type === 'p') &&
    nodeIsTextNode(lastSelectedNode[0].children?.[0]) &&
    lastSelectedNode[0].children?.[0].text === ''
  )
}
