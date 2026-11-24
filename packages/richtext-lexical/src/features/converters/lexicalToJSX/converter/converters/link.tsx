import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../types/nodeTypes.js'
import type { JSXConverters } from '../types.js'

let hasWarnedAboutInternalDocToHref = false

export const LinkJSXConverter: (args: {
  /**
   * @deprecated Add `generateFrontendPath` to the linked collections instead. Internal links then
   * use `fields.doc.frontendPath`, and this is only used for links without one. Will be removed in v5.
   */
  internalDocToHref?: (args: { linkNode: SerializedLinkNode }) => string
}) => JSXConverters<SerializedAutoLinkNode | SerializedLinkNode> = ({ internalDocToHref }) => ({
  autolink: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    const rel: string | undefined = node.fields.newTab ? 'noopener noreferrer' : undefined
    const target: string | undefined = node.fields.newTab ? '_blank' : undefined

    return (
      <a href={node.fields.url} {...{ rel, target }}>
        {children}
      </a>
    )
  },
  link: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    const rel: string | undefined = node.fields.newTab ? 'noopener noreferrer' : undefined
    const target: string | undefined = node.fields.newTab ? '_blank' : undefined

    let href: string = node.fields.url ?? ''
    if (node.fields.linkType === 'internal') {
      const frontendPath = node.fields.doc?.frontendPath

      if (frontendPath !== undefined) {
        if (internalDocToHref && !hasWarnedAboutInternalDocToHref) {
          hasWarnedAboutInternalDocToHref = true
          console.warn(
            'Lexical => JSX converter: Link converter: internalDocToHref is ignored for links that have a frontend path from generateFrontendPath, and only used for the rest. internalDocToHref is deprecated and will be removed in v5',
          )
        }
        href = frontendPath ?? '#'
      } else if (internalDocToHref) {
        href = internalDocToHref({ linkNode: node })
      } else {
        console.error(
          'Lexical => JSX converter: Link converter: found internal link without a frontend path. Add generateFrontendPath to the linked collection and fetch the document with a depth of at least 1 (the default)',
        )
        href = '#' // fallback
      }
    }

    return (
      <a href={href} {...{ rel, target }}>
        {children}
      </a>
    )
  },
})
