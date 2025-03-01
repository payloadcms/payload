import type { SerializedQuoteNode } from '../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const BlockquoteHTMLConverter: HTMLConverters<SerializedQuoteNode> = {
  quote: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    return `<blockquote${providedStyleTag}>${children}</blockquote>`
  },
}
