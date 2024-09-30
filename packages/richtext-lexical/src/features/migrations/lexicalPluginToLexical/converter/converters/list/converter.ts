/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SerializedListNode } from '../../../../../lists/plugin/index.js'
import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const ListConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode, quiet }) {
    return {
      ...lexicalPluginNode,
      type: 'list',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'list',
        quiet,
      }),
      listType: (lexicalPluginNode as any)?.listType || 'number',
      tag: (lexicalPluginNode as any)?.tag || 'ol',
      version: 1,
    } as const as SerializedListNode
  },
  nodeTypes: ['list'],
}
