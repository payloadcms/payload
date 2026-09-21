import type { SerializedHeadingNode } from '../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

import { ALLOWED_HEADING_TAGS } from '../../../../heading/constants.js'

export const HeadingJSXConverter: JSXConverters<SerializedHeadingNode> = {
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    const NodeTag = ALLOWED_HEADING_TAGS.has(node.tag) ? node.tag : 'h1'

    return <NodeTag>{children}</NodeTag>
  },
}
