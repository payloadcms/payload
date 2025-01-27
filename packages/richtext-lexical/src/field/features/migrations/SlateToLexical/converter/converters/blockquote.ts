import type { SerializedQuoteNode } from '@lexical/rich-text'

import type { SlateNodeConverter } from '../types'

import { convertSlateNodesToLexical } from '../index'

export const SlateBlockquoteConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'quote',
        slateNodes: slateNode.children || [],
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'quote',
      version: 1,
    } as const as SerializedQuoteNode
  },
  nodeTypes: ['blockquote'],
}
