import type { SerializedHeadingNode } from '../../../../../nodeTypes.js'
import type { HTMLConvertersAsync } from '../types.js'

export const HeadingHTMLConverterAsync: HTMLConvertersAsync<SerializedHeadingNode> = {
  heading: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    return `<${node.tag}${providedStyleTag}>${children}</${node.tag}>`
  },
}
