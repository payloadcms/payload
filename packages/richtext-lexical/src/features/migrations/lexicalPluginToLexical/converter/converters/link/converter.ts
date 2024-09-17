/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SerializedLinkNode } from '../../../../../link/nodes/types.js'
import type { LexicalPluginNodeConverter } from '../../types.js'

import { convertLexicalPluginNodesToLexical } from '../../index.js'

export const LinkConverter: LexicalPluginNodeConverter = {
  converter({ converters, lexicalPluginNode, quiet }) {
    return {
      type: 'link',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'link',
        quiet,
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
      version: 2,
    } as const as SerializedLinkNode
  },
  nodeTypes: ['link'],
}
