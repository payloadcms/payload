import type { SerializedLexicalNode, SerializedTextNode } from 'lexical'

import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../index'

export const TextConverter: HTMLConverter<SerializedTextNode> = {
  converter({ childIndex, converters, node, parentNodeType }) {
    return `${node.text}`
  },
  nodeTypes: ['text'],
}
