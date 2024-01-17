import type { SerializedLinkNode } from '../../../../Link/nodes/LinkNode'
import type { SlateNodeConverter } from '../types'

import { convertSlateNodesToLexical } from '..'

export const SlateLinkConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'link',
        slateNodes: slateNode.children || [],
      }),
      direction: 'ltr',
      fields: {
        ...(slateNode.fields || {}),
        doc: slateNode.doc || null,
        linkType: slateNode.linkType || 'custom',
        newTab: slateNode.newTab || false,
        url: slateNode.url || undefined,
      },
      format: '',
      indent: 0,
      type: 'link',
      version: 2,
    } as const as SerializedLinkNode
  },
  nodeTypes: ['link'],
}
