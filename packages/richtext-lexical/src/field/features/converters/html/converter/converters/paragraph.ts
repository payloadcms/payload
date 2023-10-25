import type { SerializedParagraphNode } from 'lexical'

import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../index'

export const ParagraphHTMLConverter: HTMLConverter<SerializedParagraphNode> = {
  async converter({ converters, node, parent }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
    })
    return `<p>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
