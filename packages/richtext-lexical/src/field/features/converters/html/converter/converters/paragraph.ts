import type { SerializedLexicalNode, SerializedParagraphNode } from 'lexical'

import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../index'

export const ParagraphConverter: HTMLConverter<SerializedParagraphNode> = {
  converter({ childIndex, converters, node, parentNodeType }) {
    const childrenText = convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parentNodeType,
    })
    return `<p>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
