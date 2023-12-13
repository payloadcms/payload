/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SerializedLinkNode } from '../../../../Link/nodes/LinkNode'
import type { LexicalPluginNodeConverter } from '../types'

import { convertLexicalPluginNodesToLexical } from '..'

export const LinkConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode }) {
    return {
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: (lexicalPluginNode as any).children || [],
        parentNodeType: 'link',
      }),
      direction: (lexicalPluginNode as any).direction || 'ltr',
      fields: {
        doc: (lexicalPluginNode as any).attributes?.doc
          ? {
              relationTo: (lexicalPluginNode as any).attributes?.doc?.relationTo,
              value: (lexicalPluginNode as any).attributes?.doc?.value,
            }
          : undefined,
        linkType: (lexicalPluginNode as any).attributes?.linkType || 'custom',
        newTab: (lexicalPluginNode as any).attributes?.newTab || false,
        url: (lexicalPluginNode as any).attributes?.url || undefined,
      },
      format: (lexicalPluginNode as any).format || '',
      indent: (lexicalPluginNode as any).indent || 0,
      type: 'link',
      version: 2,
    } as const as SerializedLinkNode
  },
  nodeTypes: ['link'],
}
