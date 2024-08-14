import type { SerializedLinkNode } from '../../../../../link/nodes/types.js'
import type { SlateNodeConverter } from '../../types.js'

import { convertSlateNodesToLexical } from '../../index.js'

export const SlateLinkConverter: SlateNodeConverter = {
  converter({ converters, slateNode }) {
    return {
      type: 'link',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'link',
        slateNodes: slateNode.children,
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
      version: 2,
    } as const as SerializedLinkNode
  },
  nodeTypes: ['link'],
}
