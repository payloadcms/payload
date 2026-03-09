import escapeHTML from 'escape-html'

import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

import { sanitizeUrl } from '../../shared/sanitizeUrl.js'

export const LinkHTMLConverter: (args: {
  internalDocToHref?: (args: { linkNode: SerializedLinkNode }) => string
}) => HTMLConverters<SerializedAutoLinkNode | SerializedLinkNode> = ({ internalDocToHref }) => ({
  autolink: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    const href = escapeHTML(sanitizeUrl(node.fields.url ?? ''))

    return `<a${providedStyleTag} href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${children}</a>`
  },
  link: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    let href: string = node.fields.url ?? ''
    if (node.fields.linkType === 'internal') {
      if (internalDocToHref) {
        href = internalDocToHref({ linkNode: node })
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'Lexical => HTML converter: Link converter: found internal link, but internalDocToHref is not provided',
        )
        href = '#' // fallback
      }
    }

    const safeHref = escapeHTML(sanitizeUrl(href))

    return `<a${providedStyleTag} href="${safeHref}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${children}</a>`
  },
})
