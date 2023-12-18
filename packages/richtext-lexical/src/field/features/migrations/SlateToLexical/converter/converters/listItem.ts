import type { SerializedListItemNode } from '@lexical/list'

import type { SlateNodeConverter } from '../types'

import { convertSlateNodesToLexical } from '..'

export const SlateListItemConverter: SlateNodeConverter = {
  converter({ childIndex, converters, slateNode }) {
    return {
      checked: undefined,
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'listitem',
        slateNodes: slateNode.children || [],
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'listitem',
      value: childIndex + 1,
      version: 1,
    } as const as SerializedListItemNode
  },
  nodeTypes: ['li'],
}
