import escapeHTML from 'escape-html'
import { sanitizeUrl } from 'payload/shared'

import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../types/nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const LinkHTMLConverter: (args: {
  /**
   * @deprecated Add `generateFrontendPath` to the linked collections instead. Internal links then
   * use `fields.doc.frontendPath`. Will be removed in v5.
   */
  internalDocToHref?: (args: { linkNode: SerializedLinkNode }) => string
}) => HTMLConverters<SerializedAutoLinkNode | SerializedLinkNode> = ({ internalDocToHref }) => ({
  autolink: ({ node, nodesToHTML, providedDirAttribute, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    const href = escapeHTML(sanitizeUrl(node.fields.url ?? ''))

    return `<a${providedDirAttribute}${providedStyleTag} href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${children}</a>`
  },
  link: ({ node, nodesToHTML, providedDirAttribute, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    let href: string = node.fields.url ?? ''
    if (node.fields.linkType === 'internal') {
      if (internalDocToHref) {
        href = internalDocToHref({ linkNode: node })
      } else if (typeof node.fields.doc?.frontendPath === 'string') {
        href = node.fields.doc.frontendPath
      } else {
        // eslint-disable-next-line no-console
        console.error(
          'Lexical => HTML converter: Link converter: found internal link without a frontend path. Add generateFrontendPath to the linked collection and populate the link',
        )
        href = '#' // fallback
      }
    }

    const safeHref = escapeHTML(sanitizeUrl(href))

    return `<a${providedDirAttribute}${providedStyleTag} href="${safeHref}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${children}</a>`
  },
})
