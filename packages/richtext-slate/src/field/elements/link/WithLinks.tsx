'use client'

import type React from 'react'
import type { Editor } from 'slate'

import { useSlatePlugin } from '../../../utilities/useSlatePlugin.js'

const plugin = (incomingEditor: Editor): Editor => {
  const editor = incomingEditor
  const { isInline } = editor

  editor.isInline = (element) => {
    if (element.type === 'link') {
      return true
    }

    return isInline(element)
  }

  return editor
}

export const WithLinks: React.FC = () => {
  useSlatePlugin('withLinks', plugin)
  return null
}
