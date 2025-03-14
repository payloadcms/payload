import type { SerializedParagraphNode } from '../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const ParagraphJSXConverter: JSXConverters<SerializedParagraphNode> = {
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    if (!children?.length) {
      return (
        <p>
          <br />
        </p>
      )
    }

    return <p>{children}</p>
  },
}
