import type { SerializedParagraphNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const ParagraphHTMLConverter: HTMLConverters<SerializedParagraphNode> = {
  paragraph: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    })

    if (!children?.length) {
      return `<p${providedStyleTag}><br /></p>`
    }

    return `<p${providedStyleTag}>${children.join('')}</p>`
  },
}
