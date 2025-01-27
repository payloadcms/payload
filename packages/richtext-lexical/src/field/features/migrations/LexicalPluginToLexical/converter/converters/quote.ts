import type { SerializedHeadingNode } from '@lexical/rich-text'

import type { LexicalPluginNodeConverter } from '../types'

import { convertLexicalPluginNodesToLexical } from '..'

export const QuoteConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: (lexicalPluginNode as any).children || [],
        parentNodeType: 'quote',
      }),
      type: 'quote',
      version: 1,
    } as const as SerializedHeadingNode
  },
  nodeTypes: ['quote'],
}
