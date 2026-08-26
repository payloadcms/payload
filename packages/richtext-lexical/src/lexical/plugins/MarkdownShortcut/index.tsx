'use client'

import { registerMarkdownShortcuts } from '@lexical/markdown'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import * as React from 'react'

import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js'

export const MarkdownShortcutPlugin: React.FC = () => {
  const { editorConfig } = useEditorConfigContext()
  const [editor] = useLexicalComposerContext()

  React.useEffect(() => {
    return registerMarkdownShortcuts(editor, editorConfig.features.markdownTransformers ?? [])
  }, [editor, editorConfig.features.markdownTransformers])

  return null
}
