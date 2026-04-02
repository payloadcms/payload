import escapeHTML from 'escape-html'
import React, { Fragment } from 'react'
import { Text } from 'slate'

// eslint-disable-next-line no-use-before-define
type Children = Leaf[]

type Leaf = {
  [key: string]: unknown
  children: Children
  type: string
  url?: string
  value?: {
    alt: string
    url: string
  }
}

const serialize = (children: Children): React.ReactNode[] =>
  children.map((node, i) => {
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
          <span key={i} style={{ textDecoration: 'underline' }}>
            {text}
          </span>
        )
      }

      if (node.strikethrough) {
        text = (
          <span key={i} style={{ textDecoration: 'line-through' }}>
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
      case 'blockquote':
        return <blockquote key={i}>{serialize(node.children)}</blockquote>
      case 'h1':
        return <h1 key={i}>{serialize(node.children)}</h1>
      case 'h2':
        return <h2 key={i}>{serialize(node.children)}</h2>
      case 'h3':
        return <h3 key={i}>{serialize(node.children)}</h3>
      case 'h4':
        return <h4 key={i}>{serialize(node.children)}</h4>
      case 'h5':
        return <h5 key={i}>{serialize(node.children)}</h5>
      case 'h6':
        return <h6 key={i}>{serialize(node.children)}</h6>
      case 'li':
        return <li key={i}>{serialize(node.children)}</li>
      case 'link':
        return (
          <a href={escapeHTML(node.url)} key={i}>
            {serialize(node.children)}
          </a>
        )
      case 'ol':
        return <ol key={i}>{serialize(node.children)}</ol>
      case 'ul':
        return <ul key={i}>{serialize(node.children)}</ul>

      default:
        return <p key={i}>{serialize(node.children)}</p>
    }
  })

export default serialize
