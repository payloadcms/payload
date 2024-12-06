import escapeHTML from 'escape-html'

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
    const target: string = node.fields.newTab ? ' target="_blank"' : ''

    let href: string =
      node.fields.linkType === 'custom' ? node.fields.url : node.fields.doc?.value?.id

    if (submissionData) {
      href = escapeHTML(replaceDoubleCurlys(href, submissionData))
    }

    return `<a href="${href}"${target}${rel}>${childrenText}</a>`
  },
  nodeTypes: ['link'],
}
