import type { SerializedLexicalNode } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'

import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js'
import type { DefaultNodeTypes, TypedEditorState } from '../../../nodeTypes.js'

import { getEnabledNodes } from '../../../lexical/nodes/index.js'
import { $convertFromMarkdownString } from '../../../packages/@lexical/markdown/index.js'

export const convertMarkdownToLexical = <
  TNodeTypes extends SerializedLexicalNode = DefaultNodeTypes,
>({
  editorConfig,
  markdown,
}: {
  editorConfig: SanitizedServerEditorConfig
  markdown: string
}): TypedEditorState<TNodeTypes> => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig,
    }),
  })

  headlessEditor.update(
    () => {
      $convertFromMarkdownString(markdown, editorConfig.features.markdownTransformers)
    },
    { discrete: true },
  )

  const editorJSON = headlessEditor.getEditorState().toJSON()

  return editorJSON as TypedEditorState<TNodeTypes>
}
