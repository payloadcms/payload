import type { SerializedListNode } from '../../../../../lists/plugin/index.js'
import type { SlateNodeConverter } from '../../types.js'

import { convertSlateNodesToLexical } from '../../index.js'

export const SlateUnorderedListConverter: SlateNodeConverter = {
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
      listType: 'bullet',
      start: 1,
      tag: 'ul',
      version: 1,
    } as const as SerializedListNode
  },
  nodeTypes: ['ul'],
}
