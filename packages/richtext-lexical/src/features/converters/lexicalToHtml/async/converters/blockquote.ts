import type { SerializedQuoteNode } from '../../../../../types/nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

export const BlockquoteHTMLConverterAsync: HTMLConvertersAsync<SerializedQuoteNode> = {
  quote: async ({ node, nodesToHTML, providedDirAttribute, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    return `<blockquote${providedDirAttribute}${providedStyleTag}>${children}</blockquote>`
  },
}
