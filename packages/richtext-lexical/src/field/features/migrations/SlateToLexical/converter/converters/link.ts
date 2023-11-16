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
        doc: slateNode.doc || undefined,
        linkType: slateNode.linkType || 'custom',
        newTab: slateNode.newTab || false,
        url: slateNode.url || undefined,
      },
      format: '',
      indent: 0,
      type: 'link',
      version: 1,
    } as const as SerializedLinkNode
  },
  nodeTypes: ['link'],
}
