import type { SerializedHeadingNode } from '@lexical/rich-text'

import type { SlateNodeConverter } from '../types'

import { convertSlateNodesToLexical } from '..'

export const SlateHeadingConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'heading',
        slateNodes: slateNode.children || [],
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      tag: slateNode.type as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', // Slate puts the tag (h1 / h2 / ...) inside of node.type
      type: 'heading',
      version: 1,
    } as const as SerializedHeadingNode
  },
  nodeTypes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
}
