'use client'
import { Editor, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'

import { isElementActive } from './isActive.js'
import { isWithinListItem } from './isWithinListItem.js'

export const toggleElement = (editor: Editor, format: string, blockType = 'type'): void => {
  const isActive = isElementActive(editor, format, blockType)

  const formatByBlockType = {
    [blockType]: format,
  }

  const isWithinLI = isWithinListItem(editor)

  if (isActive) {
    formatByBlockType[blockType] = undefined
  }

  if (!isActive && isWithinLI && blockType !== 'textAlign') {
    const block = { type: 'li', children: [] }
    Transforms.wrapNodes(editor, block, {
      at: Editor.unhangRange(editor, editor.selection),
    })
  }

  Transforms.setNodes(
    editor,
    { [blockType]: formatByBlockType[blockType] },
    {
      at: Editor.unhangRange(editor, editor.selection),
    },
  )

  ReactEditor.focus(editor)
}
