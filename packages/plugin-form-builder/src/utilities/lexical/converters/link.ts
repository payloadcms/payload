import type { HTMLConverter } from '../types'

import { replaceDoubleCurlys } from '../../replaceDoubleCurlys'
import { convertLexicalNodesToHTML } from '../serializeLexical'

export const LinkHTMLConverter: HTMLConverter<any> = {
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

    const rel: string = node.fields.newTab ? ' rel="noopener noreferrer"' : ''

    let href: string =
      node.fields.linkType === 'custom' ? node.fields.url : node.fields.doc?.value?.id

    if (submissionData) {
      href = replaceDoubleCurlys(href, submissionData)
    }

    return `<a href="${href}"${rel}>${childrenText}</a>`
  },
  nodeTypes: ['link'],
}
