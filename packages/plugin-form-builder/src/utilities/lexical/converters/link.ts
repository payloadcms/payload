import escapeHTML from 'escape-html'
import { sanitizeUrl } from 'payload/shared'

import type { HTMLConverter } from '../types.js'

import { replaceDoubleCurlys } from '../../replaceDoubleCurlys.js'
import { convertLexicalNodesToHTML } from '../serializeLexical.js'

export const createLinkHTMLConverter = ({ serverURL }: { serverURL: string }): HTMLConverter => ({
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

    const frontendPath = node.fields.doc?.frontendPath

    let href: string =
      node.fields.linkType === 'custom'
        ? (node.fields.url ?? '')
        : typeof frontendPath === 'string'
          ? `${serverURL}${frontendPath}`
          : ''

    if (submissionData) {
      href = replaceDoubleCurlys(href, submissionData)
    }

    const safeHref = escapeHTML(sanitizeUrl(href))

    return `<a href="${safeHref}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${childrenText}</a>`
  },
  nodeTypes: ['autolink', 'link'],
})

export const LinkHTMLConverter: HTMLConverter = createLinkHTMLConverter({ serverURL: '' })
