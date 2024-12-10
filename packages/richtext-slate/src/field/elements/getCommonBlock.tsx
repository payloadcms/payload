import type { NodeEntry, NodeMatch } from 'slate'

import { Editor, Node } from 'slate'

import type { ElementNode } from '../../types.js'

import { isBlockElement } from './isBlockElement.js'

export const getCommonBlock = (editor: Editor, match?: NodeMatch<Node>): NodeEntry<Node> => {
  const range = Editor.unhangRange(editor, editor.selection, { voids: true })

  const [common, path] = Node.common(editor, range.anchor.path, range.focus.path)

  if (isBlockElement(editor, common) || Editor.isEditor(common)) {
    return [common, path]
  }

  return Editor.above(editor, {
    at: path,
    match: match || ((n: ElementNode) => isBlockElement(editor, n) || Editor.isEditor(n)),
  })
}
