import type { SerializedParagraphNode } from 'lexical'

import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../index.js'

export const ParagraphHTMLConverter: HTMLConverter<SerializedParagraphNode> = {
  async converter({ converters, node, parent, payload }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
      payload,
    })
    return `<p>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
