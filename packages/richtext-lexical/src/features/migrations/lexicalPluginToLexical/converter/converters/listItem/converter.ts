import type { SerializedListItemNode } from '../../../../../lists/plugin/index.js'
import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const ListItemConverter: LexicalPluginNodeConverter = {
  converter({ childIndex, converters, lexicalPluginNode, quiet }) {
    return {
      ...lexicalPluginNode,
      type: 'listitem',
      checked: undefined,
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'listitem',
        quiet,
      }),
      value: childIndex + 1,
      version: 1,
    } as const as SerializedListItemNode
  },
  nodeTypes: ['listitem'],
}
