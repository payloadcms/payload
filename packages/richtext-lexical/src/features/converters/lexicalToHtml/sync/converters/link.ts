import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const LinkHTMLConverter: (args: {
  internalDocToHref?: (args: { linkNode: SerializedLinkNode }) => string
}) => HTMLConverters<SerializedAutoLinkNode | SerializedLinkNode> = ({ internalDocToHref }) => ({
  autolink: ({ node, nodesToHTML, providedStyleTag }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    return `<a${providedStyleTag} href="${node.fields.url}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>
        ${children}
      </a>`
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
        console.error(
          'Lexical => HTML converter: Link converter: found internal link, but internalDocToHref is not provided',
        )
        href = '#' // fallback
      }
    }

    return `<a${providedStyleTag} href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>
        ${children}
      </a>`
  },
})
