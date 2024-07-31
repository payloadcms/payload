import type { SerializedQuoteNode } from '../../../../../blockquote/server/index.js'
import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const QuoteConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode, quiet }) {
    return {
      ...lexicalPluginNode,
      type: 'quote',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'quote',
        quiet,
      }),
      version: 1,
    } as const as SerializedQuoteNode
  },
  nodeTypes: ['quote'],
}
