import type { SerializedHeadingNode } from '../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const HeadingJSXConverter: JSXConverters<SerializedHeadingNode> = {
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    const NodeTag = node.tag

    return <NodeTag>{children}</NodeTag>
  },
}
