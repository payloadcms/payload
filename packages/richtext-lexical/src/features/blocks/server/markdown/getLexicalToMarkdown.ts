import { createHeadlessEditor } from '@lexical/headless'

import type { NodeWithHooks } from '../../../typesServer.js'

import { getEnabledNodesFromServerNodes } from '../../../../lexical/nodes/index.js'
import {
  $convertToMarkdownString,
  type Transformer,
} from '../../../../packages/@lexical/markdown/index.js'
export function getLexicalToMarkdown(
  allNodes: Array<NodeWithHooks>,
  allTransformers: Transformer[],
): (args: { editorState: Record<string, any> }) => string {
  const lexicalToMarkdown = ({ editorState }: { editorState: Record<string, any> }): string => {
    const headlessEditor = createHeadlessEditor({
      nodes: getEnabledNodesFromServerNodes({
        nodes: allNodes,
      }),
    })

    try {
      headlessEditor.setEditorState(headlessEditor.parseEditorState(editorState as any)) // This should commit the editor state immediately
    } catch (e) {
      console.error('getLexicalToMarkdown: ERROR parsing editor state', e)
    }

    let markdown: string = ''
    headlessEditor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(allTransformers)
    })

    return markdown
  }
  return lexicalToMarkdown
}
