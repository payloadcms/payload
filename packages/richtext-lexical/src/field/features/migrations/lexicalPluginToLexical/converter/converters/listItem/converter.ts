import type { SerializedListItemNode } from '@lexical/list'

import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const _ListItemConverter: LexicalPluginNodeConverter = {
  converter({ childIndex, converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      type: 'listitem',
      checked: undefined,
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'listitem',
      }),
      value: childIndex + 1,
      version: 1,
    } as const as SerializedListItemNode
  },
  nodeTypes: ['listitem'],
}
