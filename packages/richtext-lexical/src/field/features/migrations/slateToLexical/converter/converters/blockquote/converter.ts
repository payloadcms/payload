import type { SerializedQuoteNode } from '@lexical/rich-text'

import type { SlateNodeConverter } from '../../types.js'

import { convertSlateNodesToLexical } from '../../index.js'

export const _SlateBlockquoteConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      type: 'quote',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'quote',
        slateNodes: slateNode.children,
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    } as const as SerializedQuoteNode
  },
  nodeTypes: ['blockquote'],
}
