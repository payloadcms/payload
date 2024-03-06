/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SerializedListNode } from '@lexical/list'

import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const _ListConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      ...lexicalPluginNode,
      type: 'list',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'list',
      }),
      listType: (lexicalPluginNode as any)?.listType || 'number',
      tag: (lexicalPluginNode as any)?.tag || 'ol',
      version: 1,
    } as const as SerializedListNode
  },
  nodeTypes: ['list'],
}
