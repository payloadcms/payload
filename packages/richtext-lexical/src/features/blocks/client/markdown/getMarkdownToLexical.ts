import type { Klass, LexicalNode, LexicalNodeReplacement, SerializedEditorState } from 'lexical'

import { createHeadlessEditor } from '@lexical/headless'

import {
  $convertFromMarkdownString,
  type Transformer,
} from '../../../../packages/@lexical/markdown/index.js'

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
        $convertFromMarkdownString(markdown, allTransformers)
      },
      { discrete: true },
    )

    const editorJSON = headlessEditor.getEditorState().toJSON()

    return editorJSON
  }
  return markdownToLexical
}
