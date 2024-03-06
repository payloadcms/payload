'use client'

import type React from 'react'

import { useSlatePlugin } from '../../../utilities/useSlatePlugin.js'
import { uploadName } from './shared.js'

export const WithUpload: React.FC = () => {
  useSlatePlugin('withUpload', (incomingEditor) => {
    const editor = incomingEditor
    const { isVoid } = editor

    editor.isVoid = (element) => (element.type === uploadName ? true : isVoid(element))

    return editor
  })
  return null
}
