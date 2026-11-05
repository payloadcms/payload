import type { SerializedEditorState } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'
import { $convertToMarkdownString } from '@lexical/markdown'

import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js'

import { getEnabledNodes } from '../../../lexical/nodes/index.js'

export const convertLexicalToMarkdown = ({
  data,
  editorConfig,
}: {
  data: SerializedEditorState
  editorConfig: SanitizedServerEditorConfig
}): string => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig,
    }),
  })

  headlessEditor.update(
    () => {
      headlessEditor.setEditorState(headlessEditor.parseEditorState(data))
    },
    { discrete: true },
  )

  let markdown: string = ''
  headlessEditor.getEditorState().read(() => {
    markdown = $convertToMarkdownString(editorConfig?.features?.markdownTransformers)
  })

  return markdown
}
