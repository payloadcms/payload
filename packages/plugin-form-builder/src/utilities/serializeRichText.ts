import escapeHTML from 'escape-html'

import { replaceDoubleCurlys } from './replaceDoubleCurlys'

interface Node {
  bold?: boolean
  children?: Node[]
  code?: boolean
  italic?: boolean
  text?: string
  type?: string
  url?: string
}

const isTextNode = (node: Node): node is Node & { text: string } => {
  return 'text' in node
}

export const serialize = (children?: Node[], submissionData?: any): string | undefined =>
  children
    ?.map((node: Node) => {
      if (isTextNode(node)) {
        let text = `<span>${escapeHTML(replaceDoubleCurlys(node.text, submissionData))}</span>`

        if (node.bold) {
          text = `
        <strong>
          ${text}
        </strong>
      `
        }

        if (node.code) {
          text = `
        <code>
          ${text}
        </code>
      `
        }

        if (node.italic) {
          text = `
        <em >
          ${text}
        </em>
      `
        }

        return text
      }

      if (!node) {
        return null
      }

      switch (node.type) {
        case 'h1':
          return `
        <h1>
          ${serialize(node.children, submissionData)}
        </h1>
      `
        case 'h6':
          return `
        <h6>
          ${serialize(node.children, submissionData)}
        </h6>
      `
        case 'quote':
          return `
        <blockquote>
          ${serialize(node.children, submissionData)}
        </blockquote>
      `
        case 'ul':
          return `
        <ul>
          ${serialize(node.children, submissionData)}
        </ul>
      `
        case 'ol':
          return `
        <ol>
          ${serialize(node.children, submissionData)}
        </ol>
      `
        case 'li':
          return `
        <li>
          ${serialize(node.children, submissionData)}
        </li>
      `
        case 'indent':
          return `
          <p style="padding-left: 20px">
            ${serialize(node.children, submissionData)}
          </p>
        `
        case 'link':
          return `
        <a href={${escapeHTML(node.url)}}>
          ${serialize(node.children, submissionData)}
        </a>
      `

        default:
          return `
        <p>
          ${serialize(node.children, submissionData)}
        </p>
      `
      }
    })
    .filter(Boolean)
    .join('')
