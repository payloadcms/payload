import React, { Fragment } from 'react'
import escapeHTML from 'escape-html'
import { Text } from 'slate'
import { CMSLink } from '../Link'
import { Media } from '../Media'

// eslint-disable-next-line no-use-before-define
type Children = Leaf[]

type Leaf = {
  type: string
  value?: any
  children?: Children
  url?: string
  [key: string]: unknown
}

const serializeSlate = (
  children?: Children,
  renderUploadFilenameOnly?: boolean,
): React.ReactNode[] =>
  children?.map((node, i) => {
    if (Text.isText(node)) {
      let text = <span dangerouslySetInnerHTML={{ __html: escapeHTML(node.text) }} />

      if (node.bold) {
        text = <strong key={i}>{text}</strong>
      }

      if (node.code) {
        text = <code key={i}>{text}</code>
      }

      if (node.italic) {
        text = <em key={i}>{text}</em>
      }

      if (node.underline) {
        text = (
          <span style={{ textDecoration: 'underline' }} key={i}>
            {text}
          </span>
        )
      }

      if (node.strikethrough) {
        text = (
          <span style={{ textDecoration: 'line-through' }} key={i}>
            {text}
          </span>
        )
      }

      return <Fragment key={i}>{text}</Fragment>
    }

    if (!node) {
      return null
    }

    switch (node.type) {
      case 'h1':
        return <h1 key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</h1>

      case 'h2':
        return <h2 key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</h2>

      case 'h3':
        return <h3 key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</h3>

      case 'h4':
        return <h4 key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</h4>

      case 'h5':
        return <h5 key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</h5>

      case 'h6':
        return <h6 key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</h6>

      case 'quote':
        return (
          <blockquote key={i}>
            {serializeSlate(node?.children, renderUploadFilenameOnly)}
          </blockquote>
        )

      case 'ul':
        return <ul key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</ul>

      case 'ol':
        return <ol key={i}>{serializeSlate(node.children, renderUploadFilenameOnly)}</ol>

      case 'li':
        return <li key={i}>{serializeSlate(node.children, renderUploadFilenameOnly)}</li>

      case 'relationship':
        return (
          <span key={i}>
            {node.value && typeof node.value === 'object'
              ? node.value.title || node.value.id
              : node.value}
          </span>
        )

      case 'link':
        return (
          <CMSLink
            key={i}
            type={node.linkType === 'internal' ? 'reference' : 'custom'}
            url={node.url}
            reference={node.doc as any}
            newTab={Boolean(node?.newTab)}
          >
            {serializeSlate(node?.children, renderUploadFilenameOnly)}
          </CMSLink>
        )

      case 'upload':
        if (renderUploadFilenameOnly) {
          return <span key={i}>{node.value.filename}</span>
        }

        return <Media key={i} resource={node?.value} />

      default:
        return <p key={i}>{serializeSlate(node?.children, renderUploadFilenameOnly)}</p>
    }
  }) || []

export default serializeSlate
