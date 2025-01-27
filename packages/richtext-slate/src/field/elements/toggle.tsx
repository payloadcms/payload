'use client'
import { Editor, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'

import isElementActive from './isActive'
import { isWithinListItem } from './isWithinListItem'

const toggleElement = (editor: Editor, format: string, blockType = 'type'): void => {
  const isActive = isElementActive(editor, format, blockType)

  const formatByBlockType = {
    [blockType]: format,
  }

  const isWithinLI = isWithinListItem(editor)

  if (isActive) {
    formatByBlockType[blockType] = undefined
  }

  if (!isActive && isWithinLI && blockType !== 'textAlign') {
    const block = { children: [], type: 'li' }
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

export default toggleElement
