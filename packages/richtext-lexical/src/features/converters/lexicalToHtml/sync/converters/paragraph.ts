import type { SerializedParagraphNode } from '../../../../../types/nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const ParagraphHTMLConverter: HTMLConverters<SerializedParagraphNode> = {
  paragraph: ({ node, nodesToHTML, providedDirAttribute, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    })

    if (!children?.length) {
      return `<p${providedDirAttribute}${providedStyleTag}><br /></p>`
    }

    return `<p${providedDirAttribute}${providedStyleTag}>${children.join('')}</p>`
  },
}
