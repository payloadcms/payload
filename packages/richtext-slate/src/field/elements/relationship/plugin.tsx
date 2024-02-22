'use client'

import type React from 'react'

import { useSlatePlugin } from '../../../utilities/useSlatePlugin'
import { relationshipName } from './shared'

export const WithRelationship: React.FC = () => {
  useSlatePlugin('withRelationship', (incomingEditor) => {
    const editor = incomingEditor
    const { isVoid } = editor

    editor.isVoid = (element) => (element.type === relationshipName ? true : isVoid(element))

    return editor
  })
  return null
}
