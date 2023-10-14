import type { SerializedUnknownConvertedNode } from '../../nodes/unknownConvertedNode'
import type { LexicalPluginNodeConverter } from '../types'

import { convertLexicalPluginNodesToLexical } from '..'

export const UnknownConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: (lexicalPluginNode as any)?.children || [],
        parentNodeType: 'unknownConverted',
      }),
      data: {
        nodeData: lexicalPluginNode,
        nodeType: lexicalPluginNode.type,
      },
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'unknownConverted',
      version: 1,
    } as const as SerializedUnknownConvertedNode
  },
  nodeTypes: ['unknown'],
}
