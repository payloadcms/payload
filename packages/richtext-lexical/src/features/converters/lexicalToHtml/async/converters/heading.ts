import type { SerializedHeadingNode } from '../../../../../nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

import { ALLOWED_HEADING_TAGS } from '../../../../heading/constants.js'

export const HeadingHTMLConverterAsync: HTMLConvertersAsync<SerializedHeadingNode> = {
  heading: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    const tag = ALLOWED_HEADING_TAGS.has(node.tag) ? node.tag : 'h1'

    return `<${tag}${providedStyleTag}>${children}</${tag}>`
  },
}
