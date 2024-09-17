import type { SerializedUnknownConvertedNode } from '../../../nodes/unknownConvertedNode/index.js'
import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const UnknownConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode, quiet }) {
    return {
      type: 'unknownConverted',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'unknownConverted',
        quiet,
      }),
      data: {
        nodeData: lexicalPluginNode,
        nodeType: lexicalPluginNode.type,
      },
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    } as const as SerializedUnknownConvertedNode
  },
  nodeTypes: ['unknown'],
}
