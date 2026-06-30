import type { Transformer } from '@lexical/markdown'
import type { Klass, LexicalNode, LexicalNodeReplacement, SerializedEditorState } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'

import { $convertFromMarkdownString } from '../../../../lexical/utils/markdown/convertFromMarkdownString.js'

export function getMarkdownToLexical(
  allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>,
  allTransformers: Transformer[],
): (args: { markdown: string }) => SerializedEditorState {
  const markdownToLexical = ({ markdown }: { markdown: string }): SerializedEditorState => {
    const headlessEditor = createHeadlessEditor({
      nodes: allNodes,
    })

    headlessEditor.update(
      () => {
        // shouldMergeAdjacentLines is true to preserve how Payload parses block
        // content (multi-line tags, soft-wrapped lines). The exported
        // $convertFromMarkdownString now defaults to false to match upstream.
        $convertFromMarkdownString(markdown, allTransformers, undefined, false, true)
      },
      { discrete: true },
    )

    const editorJSON = headlessEditor.getEditorState().toJSON()

    return editorJSON
  }
  return markdownToLexical
}
