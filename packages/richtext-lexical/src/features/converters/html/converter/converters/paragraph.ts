import type { SerializedParagraphNode } from 'lexical'

import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../index.js'

export const ParagraphHTMLConverter: HTMLConverter<SerializedParagraphNode> = {
  async converter({ converters, node, parent, req }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
      req,
    })
    return `<p>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
