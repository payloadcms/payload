import type { SerializedQuoteNode } from '../../../../../nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

export const BlockquoteHTMLConverterAsync: HTMLConvertersAsync<SerializedQuoteNode> = {
  quote: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    return `<blockquote${providedStyleTag}>${children}</blockquote>`
  },
}
