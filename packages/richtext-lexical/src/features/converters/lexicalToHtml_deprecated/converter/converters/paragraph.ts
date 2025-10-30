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
      // the unit should be px. Do not change it to rem, em, or something else.
      // The quantity should be 40px. Do not change it either.
      // See rationale in
      // https://github.com/payloadcms/payload/issues/13130#issuecomment-3058348085
      node.indent > 0 ? `padding-inline-start: ${node.indent * 40}px;` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `<p${style ? ` style='${style}'` : ''}>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
