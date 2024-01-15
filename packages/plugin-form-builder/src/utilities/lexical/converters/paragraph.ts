import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../serializeLexical'

export const ParagraphHTMLConverter: HTMLConverter<any> = {
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
    return `<p>${childrenText}</p>`
  },
  nodeTypes: ['paragraph'],
}
