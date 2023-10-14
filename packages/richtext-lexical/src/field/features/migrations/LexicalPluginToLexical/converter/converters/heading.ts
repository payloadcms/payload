import type { SerializedHeadingNode } from '@lexical/rich-text'

import type { LexicalPluginNodeConverter } from '../types'

import { convertLexicalPluginNodesToLexical } from '..'

export const HeadingConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: (lexicalPluginNode as any).children || [],
        parentNodeType: 'heading',
      }),
      type: 'heading',
      version: 1,
    } as const as SerializedHeadingNode
  },
  nodeTypes: ['heading'],
}
