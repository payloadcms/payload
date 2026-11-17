import type { SerializedQuoteNode } from '../../../../../types/nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const BlockquoteHTMLConverter: HTMLConverters<SerializedQuoteNode> = {
  quote: ({ node, nodesToHTML, providedDirAttribute, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    return `<blockquote${providedDirAttribute}${providedStyleTag}>${children}</blockquote>`
  },
}
