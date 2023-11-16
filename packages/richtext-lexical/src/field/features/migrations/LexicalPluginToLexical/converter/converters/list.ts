import type { SerializedListNode } from '@lexical/list'

import type { LexicalPluginNodeConverter } from '../types'

import { convertLexicalPluginNodesToLexical } from '..'

export const ListConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: (lexicalPluginNode as any).children || [],
        parentNodeType: 'list',
      }),
      listType: (lexicalPluginNode as any)?.listType || 'number',
      tag: (lexicalPluginNode as any)?.tag || 'ol',
      type: 'list',
      version: 1,
    } as const as SerializedListNode
  },
  nodeTypes: ['list'],
}
