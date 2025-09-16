import type { SerializedLexicalNode } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'
import { $convertFromMarkdownString } from '@lexical/markdown'

import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js'
import type { DefaultNodeTypes, TypedEditorState } from '../../../nodeTypes.js'

import { getEnabledNodes } from '../../../lexical/nodes/index.js'

export const convertMarkdownToLexical = <
  TNodeTypes extends SerializedLexicalNode = DefaultNodeTypes,
>({
  editorConfig,
  markdown,
  mergeAdjacentLines,
  preserveNewLines,
}: {
  editorConfig: SanitizedServerEditorConfig
  markdown: string
  mergeAdjacentLines: boolean
  preserveNewLines: boolean
}): TypedEditorState<TNodeTypes> => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig,
    }),
  })

  const finalPreserveNewLines = preserveNewLines ?? false
  const finalMergeAdjacentLines = mergeAdjacentLines ?? false

  headlessEditor.update(
    () => {
      $convertFromMarkdownString(
        markdown,
        editorConfig.features.markdownTransformers,
        undefined,
        finalPreserveNewLines,
        finalMergeAdjacentLines,
      )
    },
    { discrete: true },
  )

  const editorJSON = headlessEditor.getEditorState().toJSON()

  return editorJSON as TypedEditorState<TNodeTypes>
}
