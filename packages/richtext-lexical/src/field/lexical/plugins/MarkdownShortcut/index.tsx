'use client'

import lexicalMarkdownShortcutPluginImport from '@lexical/react/LexicalMarkdownShortcutPlugin.js'
const { MarkdownShortcutPlugin: LexicalMarkdownShortcutPlugin } =
  lexicalMarkdownShortcutPluginImport

import * as React from 'react'

import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js'

export const MarkdownShortcutPlugin: React.FC = () => {
  const { editorConfig } = useEditorConfigContext()

  return <LexicalMarkdownShortcutPlugin transformers={editorConfig.features.markdownTransformers} />
}
