import { Editor, Element } from 'slate'

import { getCommonBlock } from './getCommonBlock.js'

export const isListActive = (editor: Editor, format: string): boolean => {
  if (!editor.selection) {
    return false
  }
  const [topmostSelectedNode, topmostSelectedNodePath] = getCommonBlock(editor)

  if (Editor.isEditor(topmostSelectedNode)) {
    return false
  }

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: topmostSelectedNodePath,
      match: (node, path) => {
        return (
          !Editor.isEditor(node) &&
          Element.isElement(node) &&
          node.type === format &&
          path.length >= topmostSelectedNodePath.length - 2
        )
      },
      mode: 'lowest',
    }),
  )

  return !!match
}
