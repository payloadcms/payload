import React from 'react'
import type { LexicalNodes_C9C3FC1A, LexicalRichText } from '../../payload-types.js'
import { safeHref } from '../../utilities/safeHref.js'

type RichTextNode = LexicalNodes_C9C3FC1A
export type RichTextData = LexicalRichText<LexicalNodes_C9C3FC1A> | null | undefined

function renderNodes(nodes: RichTextNode[] | undefined): React.ReactNode {
  return (
    nodes?.map((node, index) => {
      const children =
        'children' in node ? renderNodes(node.children) : 'text' in node ? node.text : null
      if (node.type === 'text') {
        let formatted: React.ReactNode = node.text
        if (node.format & 1) formatted = <strong>{formatted}</strong>
        if (node.format & 2) formatted = <em>{formatted}</em>
        if (node.format & 4) formatted = <s>{formatted}</s>
        if (node.format & 8) formatted = <u>{formatted}</u>
        if (node.format & 16) formatted = <code>{formatted}</code>
        return <React.Fragment key={index}>{formatted}</React.Fragment>
      }
      if (node.type === 'link' || node.type === 'autolink') {
        const href = safeHref(node.fields.url)
        if (href) {
          return (
            <a
              key={index}
              href={href}
              target={node.fields.newTab ? '_blank' : undefined}
              rel={node.fields.newTab ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          )
        }
        return <React.Fragment key={index}>{children}</React.Fragment>
      }
      if (node.type === 'heading' && /^h[1-6]$/.test(node.tag ?? ''))
        return React.createElement(node.tag!, { key: index }, children)
      if (node.type === 'paragraph') return <p key={index}>{children}</p>
      if (node.type === 'list')
        return React.createElement(node.tag === 'ol' ? 'ol' : 'ul', { key: index }, children)
      if (node.type === 'listitem') return <li key={index}>{children}</li>
      if (node.type === 'quote') return <blockquote key={index}>{children}</blockquote>
      if (node.type === 'linebreak') return <br key={index} />
      return <React.Fragment key={index}>{children}</React.Fragment>
    }) ?? null
  )
}

export function RichText({ data }: { data: RichTextData }) {
  if (!data?.root?.children?.length) return null
  return <div className="template-post__content">{renderNodes(data.root.children)}</div>
}
