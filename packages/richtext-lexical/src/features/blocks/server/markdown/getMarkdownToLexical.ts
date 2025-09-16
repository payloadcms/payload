import type { SerializedEditorState } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'

import type { NodeWithHooks } from '../../../typesServer.js'

import { getEnabledNodesFromServerNodes } from '../../../../lexical/nodes/index.js'
import {
  $convertFromMarkdownString,
  type Transformer,
} from '../../../../packages/@lexical/markdown/index.js'
export function getMarkdownToLexical(
  allNodes: Array<NodeWithHooks>,
  allTransformers: Transformer[],
): (args: { markdown: string }) => SerializedEditorState {
  const markdownToLexical = ({ markdown }: { markdown: string }): SerializedEditorState => {
    const headlessEditor = createHeadlessEditor({
      nodes: getEnabledNodesFromServerNodes({
        nodes: allNodes,
      }),
    })

    headlessEditor.update(
      () => {
        $convertFromMarkdownString(markdown, allTransformers)
      },
      { discrete: true },
    )

    return headlessEditor.getEditorState().toJSON()
  }
  return markdownToLexical
}
