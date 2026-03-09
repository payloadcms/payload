import escapeHTML from 'escape-html'

import type { HTMLConverter } from '../types.js'

import { replaceDoubleCurlys } from '../../replaceDoubleCurlys.js'
import { convertLexicalNodesToHTML } from '../serializeLexical.js'

/** Only allow safe URL protocols */
function sanitizeUrl(url: string): string {
  if (!url) {
    return ''
  }
  const trimmed = url.trim()
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed
  }
  const protocolMatch = trimmed.match(/^([a-z][a-z0-9+\-.]*):/i)
  if (protocolMatch) {
    const protocol = protocolMatch[1]!.toLowerCase()
    if (
      protocol !== 'http' &&
      protocol !== 'https' &&
      protocol !== 'mailto' &&
      protocol !== 'tel'
    ) {
      return '#'
    }
  }
  return trimmed
}

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
