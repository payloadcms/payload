import type { SerializedLexicalNode } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'

import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js'
import type { DefaultNodeTypes, TypedEditorState } from '../../../types/nodeTypes.js'

import { getEnabledNodes } from '../../../lexical/nodes/index.js'
import { $convertFromMarkdownString } from '../../../lexical/utils/markdown/convertFromMarkdownString.js'

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
      // shouldMergeAdjacentLines is true so multi-line Payload block tags and
      // soft-wrapped content keep being parsed as before. The exported
      // $convertFromMarkdownString now defaults to false to match upstream.
      $convertFromMarkdownString(
        markdown,
        editorConfig.features.markdownTransformers,
        undefined,
        false,
        true,
      )
    },
    { discrete: true },
  )

  const editorJSON = headlessEditor.getEditorState().toJSON()

  return editorJSON as TypedEditorState<TNodeTypes>
}
