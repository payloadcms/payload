import type { HTMLConverter } from '../types.js'

import { convertLexicalNodesToHTML } from '../serializeLexical.js'

const ALLOWED_HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const ALLOWED_TEXT_ALIGN = new Set(['center', 'end', 'justify', 'left', 'right', 'start'])

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
    const tag = ALLOWED_HEADING_TAGS.has(node?.tag) ? node.tag : 'h1'
    const style = [
      node.format && ALLOWED_TEXT_ALIGN.has(node.format) ? `text-align: ${node.format};` : '',
      node.indent > 0 ? `padding-inline-start: ${node.indent * 40}px;` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `<${tag}${style ? ` style='${style}'` : ''}>${childrenText}</${tag}>`
  },
  nodeTypes: ['heading'],
}
