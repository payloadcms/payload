import type { SerializedUnknownConvertedNode } from '../../nodes/unknownConvertedNode'
import type { SlateNodeConverter } from '../types'

import { convertSlateNodesToLexical } from '..'

export const SlateUnknownConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      type: 'unknownConverted',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'unknownConverted',
        slateNodes: slateNode.children || [],
      }),
      data: {
        nodeData: slateNode,
        nodeType: slateNode.type,
      },
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    } as const as SerializedUnknownConvertedNode
  },
  nodeTypes: ['unknown'],
}
