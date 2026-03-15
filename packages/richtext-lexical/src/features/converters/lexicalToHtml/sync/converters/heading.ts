import type { SerializedHeadingNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

const ALLOWED_HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

export const HeadingHTMLConverter: HTMLConverters<SerializedHeadingNode> = {
  heading: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    const tag = ALLOWED_HEADING_TAGS.has(node.tag) ? node.tag : 'h1'

    return `<${tag}${providedStyleTag}>${children}</${tag}>`
  },
}
