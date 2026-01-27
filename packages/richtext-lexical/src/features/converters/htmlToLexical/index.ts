import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot, $getSelection, type SerializedLexicalNode } from 'lexical'

import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js'
import type { DefaultNodeTypes, TypedEditorState } from '../../../nodeTypes.js'

import { getEnabledNodes } from '../../../lexical/nodes/index.js'
import { $generateNodesFromDOM } from '../../../lexical-proxy/@lexical-html.js'

export const convertHTMLToLexical = <TNodeTypes extends SerializedLexicalNode = DefaultNodeTypes>({
  editorConfig,
  html,
  JSDOM,
}: {
  editorConfig: SanitizedServerEditorConfig
  html: string
  JSDOM: new (html: string) => {
    window: {
      document: Document
    }
  }
}): TypedEditorState<TNodeTypes> => {
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({
      editorConfig,
    }),
  })

  headlessEditor.update(
    () => {
      const dom = new JSDOM(html)

      const nodes = $generateNodesFromDOM(headlessEditor, dom.window.document)

      $getRoot().select()

      const selection = $getSelection()
      if (selection === null) {
        throw new Error('Selection is null')
      }
      selection.insertNodes(nodes)
    },
    { discrete: true },
  )

  const editorJSON = headlessEditor.getEditorState().toJSON()

  return editorJSON as TypedEditorState<TNodeTypes>
}
