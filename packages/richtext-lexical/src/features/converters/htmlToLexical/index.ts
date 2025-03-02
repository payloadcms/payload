import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot, $getSelection, type SerializedLexicalNode } from 'lexical'

import type { SanitizedServerEditorConfig } from '../../../lexical/config/types.js'
import type { DefaultNodeTypes, TypedEditorState } from '../../../nodeTypes.js'

import {} from '../../../lexical/config/server/sanitize.js'
import { getEnabledNodes } from '../../../lexical/nodes/index.js'
import { $generateNodesFromDOM } from '../../../lexical-proxy/@lexical-html.js'

export const convertHTMLToLexical = <TNodeTypes extends SerializedLexicalNode = DefaultNodeTypes>({
  editorConfig,
  html,
  JSDOM,
}: {
  editorConfig: SanitizedServerEditorConfig
  html: string
  // jsdom package constructor that accepts a string. type this so that it acceots constructor
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
      // In a headless environment you can use a package such as JSDom to parse the HTML string.
      const dom = new JSDOM(html)

      // Once you have the DOM instance it's easy to generate LexicalNodes.
      const nodes = $generateNodesFromDOM(headlessEditor, dom.window.document)

      // Select the root
      $getRoot().select()

      // Insert them at a selection.
      const selection = $getSelection()
      if (selection === null) {
        throw new Error('Selection is null')
      }
      selection.insertNodes(nodes)
    },
    { discrete: true },
  )

  // Do this if you then want to get the editor JSON
  const editorJSON = headlessEditor.getEditorState().toJSON()

  return editorJSON as TypedEditorState<TNodeTypes>
}
