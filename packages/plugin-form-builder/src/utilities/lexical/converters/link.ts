import type { HTMLConverter } from '../types'

import { convertLexicalNodesToHTML } from '../serializeLexical'

export const LinkHTMLConverter: HTMLConverter<any> = {
  async converter({ converters, node, parent }) {
    const childrenText = await convertLexicalNodesToHTML({
      converters,
      lexicalNodes: node.children,
      parent: {
        ...node,
        parent,
      },
    })

    const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''

    const href: string =
      node.fields.linkType === 'custom' ? node.fields.url : node.fields.doc?.value?.id

    return `<a href="${href}"${rel}>${childrenText}</a>`
  },
  nodeTypes: ['link'],
}
