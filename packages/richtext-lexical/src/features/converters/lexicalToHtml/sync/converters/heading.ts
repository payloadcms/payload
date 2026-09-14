import type { SerializedHeadingNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

import { ALLOWED_HEADING_TAGS } from '../../../../heading/constants.js'

export const HeadingHTMLConverter: HTMLConverters<SerializedHeadingNode> = {
  heading: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    const tag = ALLOWED_HEADING_TAGS.has(node.tag) ? node.tag : 'h1'

    return `<${tag}${providedStyleTag}>${children}</${tag}>`
  },
}
