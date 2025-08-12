import type { SerializedQuoteNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const BlockquoteHTMLConverter: HTMLConverters<SerializedQuoteNode> = {
  quote: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    return `<blockquote${providedStyleTag}>${children}</blockquote>`
  },
}
