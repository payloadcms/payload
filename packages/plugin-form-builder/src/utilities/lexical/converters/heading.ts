import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../serializeLexical'

export const HeadingHTMLConverter: HTMLConverter<any> = {
  async converter({ converters, node, parent }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
    })

    return '<' + node?.tag + '>' + childrenText + '</' + node?.tag + '>'
  },
  nodeTypes: ['heading'],
}
