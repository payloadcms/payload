import type { SerializedHeadingNode } from '../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const HeadingHTMLConverter: HTMLConverters<SerializedHeadingNode> = {
  heading: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    return `<${node.tag}${providedStyleTag}>${children}</${node.tag}>`
  },
}
