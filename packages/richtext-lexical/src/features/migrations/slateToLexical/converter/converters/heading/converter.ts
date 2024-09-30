import type { SerializedHeadingNode } from '../../../../../heading/server/index.js'
import type { SlateNodeConverter } from '../../types.js'

import { convertSlateNodesToLexical } from '../../index.js'

export const SlateHeadingConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      type: 'heading',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'heading',
        slateNodes: slateNode.children!,
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      tag: slateNode.type as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', // Slate puts the tag (h1 / h2 / ...) inside of node.type
      version: 1,
    } as const as SerializedHeadingNode
  },
  nodeTypes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
}
