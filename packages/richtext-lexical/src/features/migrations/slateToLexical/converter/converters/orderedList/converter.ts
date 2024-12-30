import type { SerializedListNode } from '../../../../../lists/plugin/index.js'
import type { SlateNodeConverter } from '../../types.js'

import { convertSlateNodesToLexical } from '../../index.js'

export const SlateOrderedListConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      type: 'list',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'list',
        slateNodes: slateNode.children!,
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      listType: 'number',
      start: 1,
      tag: 'ol',
      version: 1,
    } as const as SerializedListNode
  },
  nodeTypes: ['ol'],
}
