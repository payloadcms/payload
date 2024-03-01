'use client'
import { MarkdownShortcutPlugin as LexicalMarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import * as React from 'react'

import { useEditorConfigContext } from '../../config/client/EditorConfigProvider'

export const MarkdownShortcutPlugin: React.FC = () => {
  const { editorConfig } = useEditorConfigContext()

  return <LexicalMarkdownShortcutPlugin transformers={editorConfig.features.markdownTransformers} />
}
