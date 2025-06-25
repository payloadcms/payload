import type { SerializedParagraphNode } from '../../../../../nodeTypes.js'
import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../index.js'

export const ParagraphHTMLConverter: HTMLConverter<SerializedParagraphNode> = {
  async converter({
    converters,
    currentDepth,
    depth,
    draft,
    node,
    overrideAccess,
    parent,
    req,
    showHiddenFields,
  }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      currentDepth,
      depth,
      draft,
      lexicalNodes: node.children,
      overrideAccess,
      parent: {
        ...node,
        parent,
      },
      req,
      showHiddenFields,
    })
    const style = [
      node.format ? `text-align: ${node.format};` : '',
      node.indent > 0 ? `padding-inline-start: ${Number(node.indent) * 2}rem;` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `<p${style ? ` style='${style}'` : ''}>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
