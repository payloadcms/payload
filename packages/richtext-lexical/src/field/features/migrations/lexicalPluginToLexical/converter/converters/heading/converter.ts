import type { SerializedHeadingNode } from '@lexical/rich-text'

import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const _HeadingConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      type: 'heading',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'heading',
      }),
      version: 1,
    } as const as SerializedHeadingNode
  },
  nodeTypes: ['heading'],
}
