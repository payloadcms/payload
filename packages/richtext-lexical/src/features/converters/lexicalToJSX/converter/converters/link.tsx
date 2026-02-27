import type { SerializedAutoLinkNode, SerializedLinkNode } from '../../../../../nodeTypes.js'
import type { JSXConverters } from '../types.js'

export const LinkJSXConverter: (args: {
  internalDocToHref?: (args: { linkNode: SerializedLinkNode }) => string
  LinkComponent?: React.ComponentType<{
    children: React.ReactNode
    href: string
    rel?: string
    target?: string
  }>
}) => JSXConverters<SerializedAutoLinkNode | SerializedLinkNode> = ({
  internalDocToHref,
  LinkComponent,
}) => ({
  autolink: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({
      nodes: node.children,
    })

    const rel: string | undefined = node.fields.newTab ? 'noopener noreferrer' : undefined
    const target: string | undefined = node.fields.newTab ? '_blank' : undefined

    if (LinkComponent) {
      return (
        <LinkComponent href={node.fields.url ?? ''} rel={rel} target={target}>
          {children}
        </LinkComponent>
      )
    }

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
      if (internalDocToHref) {
        href = internalDocToHref({ linkNode: node })
      } else {
        console.error(
          'Lexical => JSX converter: Link converter: found internal link, but internalDocToHref is not provided',
        )
        href = '#' // fallback
      }
    }

    if (LinkComponent) {
      return (
        <LinkComponent href={href} rel={rel} target={target}>
          {children}
        </LinkComponent>
      )
    }

    return (
      <a href={href} {...{ rel, target }}>
        {children}
      </a>
    )
  },
})
