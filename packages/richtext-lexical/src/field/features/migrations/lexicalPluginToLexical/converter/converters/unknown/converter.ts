import type { SerializedUnknownConvertedNode } from '../../../nodes/unknownConvertedNode'
import type { LexicalPluginNodeConverter } from '../../types'

import { convertLexicalPluginNodesToLexical } from '../../index'

export const _UnknownConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      type: 'unknownConverted',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'unknownConverted',
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
