import escapeHTML from 'escape-html'

import { replaceDoubleCurlys } from '../replaceDoubleCurlys.js'

interface Node {
  bold?: boolean
  children?: Node[]
  code?: boolean
  italic?: boolean
  text?: string
  type?: string
  url?: string
}

const isTextNode = (node: Node): node is { text: string } & Node => {
  return 'text' in node
}

export const serializeSlate = (children?: Node[], submissionData?: any): string | undefined =>
  children
    ?.map((node: Node) => {
      if (isTextNode(node)) {
        let text = node.text.includes('{{*')
          ? replaceDoubleCurlys(node.text, submissionData)
          : `<span>${escapeHTML(replaceDoubleCurlys(node.text, submissionData))}</span>`

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
          ${serializeSlate(node.children, submissionData)}
        </h1>
      `
        case 'h2':
          return `
        <h2>
          ${serializeSlate(node.children, submissionData)}
        </h2>
      `
        case 'h3':
          return `
        <h3>
          ${serializeSlate(node.children, submissionData)}
        </h3>
      `
        case 'h4':
          return `
        <h4>
          ${serializeSlate(node.children, submissionData)}
        </h4>
      `
        case 'h5':
          return `
        <h5>
          ${serializeSlate(node.children, submissionData)}
        </h5>
      `
        case 'h6':
          return `
        <h6>
          ${serializeSlate(node.children, submissionData)}
        </h6>
      `
        case 'indent':
          return `
          <p style="padding-left: 20px">
            ${serializeSlate(node.children, submissionData)}
          </p>
        `
        case 'li':
          return `
        <li>
          ${serializeSlate(node.children, submissionData)}
        </li>
      `
        case 'link':
          return `
          <a href={${escapeHTML(replaceDoubleCurlys(node.url!, submissionData))}}>
          ${serializeSlate(node.children, submissionData)}
        </a>
      `
        case 'ol':
          return `
        <ol>
          ${serializeSlate(node.children, submissionData)}
        </ol>
      `
        case 'quote':
          return `
        <blockquote>
          ${serializeSlate(node.children, submissionData)}
        </blockquote>
      `
        case 'ul':
          return `
        <ul>
          ${serializeSlate(node.children, submissionData)}
        </ul>
      `

        default:
          return `
        <p>
          ${serializeSlate(node.children, submissionData)}
        </p>
      `
      }
    })
    .filter(Boolean)
    .join('')
