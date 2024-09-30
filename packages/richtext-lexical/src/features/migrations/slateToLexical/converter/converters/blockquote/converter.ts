import type { SerializedQuoteNode } from '../../../../../blockquote/server/index.js'
import type { SlateNodeConverter } from '../../types.js'

import { convertSlateNodesToLexical } from '../../index.js'

export const SlateBlockquoteConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      type: 'quote',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'quote',
        slateNodes: slateNode.children!,
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    } as const as SerializedQuoteNode
  },
  nodeTypes: ['blockquote'],
}
