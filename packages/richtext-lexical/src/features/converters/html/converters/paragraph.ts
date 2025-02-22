import type { SerializedParagraphNode } from '../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const ParagraphHTMLConverter: HTMLConverters<SerializedParagraphNode> = {
  paragraph: ({ node, nodesToHTML }) => {
    const children = nodesToHTML({
      nodes: node.children,
    })

    if (!children?.length) {
      return `<p><br /></p>`
    }

    return `<p>${children.join('')}</p>`
  },
}
