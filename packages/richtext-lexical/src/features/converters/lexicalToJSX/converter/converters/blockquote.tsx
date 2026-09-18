import type { SerializedQuoteNode } from '../../../../../types/nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const BlockquoteJSXConverter: JSXConverters<SerializedQuoteNode> = {
  quote: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    return <blockquote>{children}</blockquote>
  },
}
