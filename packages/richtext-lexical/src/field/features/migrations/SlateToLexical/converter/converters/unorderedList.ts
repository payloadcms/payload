import type { SerializedListNode } from '@lexical/list'

import type { SlateNodeConverter } from '../types'

import { convertSlateNodesToLexical } from '..'

export const SlateUnorderedListConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'list',
        slateNodes: slateNode.children || [],
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      listType: 'bullet',
      start: 1,
      tag: 'ul',
      type: 'list',
      version: 1,
    } as const as SerializedListNode
  },
  nodeTypes: ['ul'],
}
