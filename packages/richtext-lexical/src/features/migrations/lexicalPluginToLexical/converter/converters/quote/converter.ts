import type { SerializedQuoteNode } from '../../../../../blockquote/feature.server.js'
import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const _QuoteConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      type: 'quote',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'quote',
      }),
      version: 1,
    } as const as SerializedQuoteNode
  },
  nodeTypes: ['quote'],
}
