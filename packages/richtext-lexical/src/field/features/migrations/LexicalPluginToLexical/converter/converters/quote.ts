import type { SerializedHeadingNode } from '@lexical/rich-text'

import type { LexicalPluginNodeConverter } from '../types'

import { convertLexicalPluginNodesToLexical } from '..'

export const QuoteConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      type: 'quote',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: (lexicalPluginNode as any).children || [],
        parentNodeType: 'quote',
      }),
      version: 1,
    } as const as SerializedHeadingNode
  },
  nodeTypes: ['quote'],
}
