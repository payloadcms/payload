import escapeHTML from 'escape-html'
import { sanitizeUrl } from 'payload/shared'

import type { HTMLConverter } from '../types.js'

import { replaceDoubleCurlys } from '../../replaceDoubleCurlys.js'
import { convertLexicalNodesToHTML } from '../serializeLexical.js'

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

    let href: string =
      node.fields.linkType === 'custom'
        ? (node.fields.url ?? '')
        : (node.fields.doc?.value?.id ?? '')

    if (submissionData) {
      href = replaceDoubleCurlys(href, submissionData)
    }

    const safeHref = escapeHTML(sanitizeUrl(href))

    return `<a href="${safeHref}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${childrenText}</a>`
  },
  nodeTypes: ['link'],
}
