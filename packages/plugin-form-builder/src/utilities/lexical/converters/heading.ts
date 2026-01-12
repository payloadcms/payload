import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../serializeLexical.js'

export const HeadingHTMLConverter: HTMLConverter<any> = {
  async converter({ converters, node, parent, submissionData }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
      submissionData,
    })
    const style = [
      node.format ? `text-align: ${node.format};` : '',
      node.indent > 0 ? `padding-inline-start: ${node.indent * 40}px;` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `<${node?.tag}${style ? ` style='${style}'` : ''}>${childrenText}</${node?.tag}>`
  },
  nodeTypes: ['heading'],
}
