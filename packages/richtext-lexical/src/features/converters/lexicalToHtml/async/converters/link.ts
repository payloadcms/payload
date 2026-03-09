import escapeHTML from 'escape-html'

import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../nodeTypes.js'
import type { HTMLConvertersAsync, HTMLPopulateFn } from '../types.js'

import { sanitizeUrl } from '../../shared/sanitizeUrl.js'

export const LinkHTMLConverterAsync: (args: {
  internalDocToHref?: (args: {
    linkNode: SerializedLinkNode
    populate?: HTMLPopulateFn
  }) => Promise<string> | string
}) => HTMLConvertersAsync<SerializedAutoLinkNode | SerializedLinkNode> = ({
  internalDocToHref,
}) => ({
  autolink: async ({ node, nodesToHTML, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    const href = escapeHTML(sanitizeUrl(node.fields.url ?? ''))

    return `<a${providedStyleTag} href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${children}</a>`
  },
  link: async ({ node, nodesToHTML, populate, providedStyleTag }) => {
    const children = (
      await nodesToHTML({
        nodes: node.children,
      })
    ).join('')

    let href: string = node.fields.url ?? ''
    if (node.fields.linkType === 'internal') {
      if (internalDocToHref) {
        href = await internalDocToHref({ linkNode: node, populate })
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
