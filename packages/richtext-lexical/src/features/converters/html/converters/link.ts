import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../nodeTypes.js'
import type { HTMLConverters } from '../types.js'

export const LinkHTMLConverter: (args: {
  internalDocToHref?: (args: { linkNode: SerializedLinkNode }) => string
}) => HTMLConverters<SerializedAutoLinkNode | SerializedLinkNode> = ({ internalDocToHref }) => ({
  autolink: ({ node, nodesToHTML }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    const rel: string | undefined = node.fields.newTab ? 'noopener noreferrer' : undefined
    const target: string | undefined = node.fields.newTab ? '_blank' : undefined

    return `(
      <a href="${node.fields.url}" rel=${rel} target=${target}>
        ${children}
      </a>
    )`
  },
  link: ({ node, nodesToHTML }) => {
    const children = nodesToHTML({
      nodes: node.children,
    }).join('')

    const rel: string | undefined = node.fields.newTab ? 'noopener noreferrer' : undefined
    const target: string | undefined = node.fields.newTab ? '_blank' : undefined

    let href: string = node.fields.url ?? ''
    if (node.fields.linkType === 'internal') {
      if (internalDocToHref) {
        href = internalDocToHref({ linkNode: node })
      } else {
        console.error(
          'Lexical => JSX converter: Link converter: found internal link, but internalDocToHref is not provided',
        )
        href = '#' // fallback
      }
    }

    return `(
      <a href="${href}" rel=${rel} target=${target}>
        ${children}
      </a>
    )`
  },
})
