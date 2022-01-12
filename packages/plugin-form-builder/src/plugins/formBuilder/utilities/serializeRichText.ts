import escapeHTML from 'escape-html';
import { Text } from 'slate';
import { replaceDoubleCurlys } from './replaceDoubleCurlys';

type Node = {
  bold?: boolean
  code?: boolean
  italic?: boolean
  type?: string
  url?: string
  children?: Node[]
}

export const serialize = (children, submissionData) => children.map((node: Node, i) => {
  if (Text.isText(node)) {
    let text = `<span>${escapeHTML(replaceDoubleCurlys(node.text, submissionData))}</span>`;

    if (node.bold) {
      text = (`
        <strong>
          ${text}
        </strong>
      `);
    }

    if (node.code) {
      text = (`
        <code>
          ${text}
        </code>
      `);
    }

    if (node.italic) {
      text = (`
        <em >
          ${text}
        </em>
      `);
    }

    return text;
  }

  if (!node) {
    return null;
  }

  switch (node.type) {
    case 'h1':
      return (`
        <h1>
          ${serialize(node.children, submissionData)}
        </h1>
      `);
    case 'h6':
      return (`
        <h6>
          ${serialize(node.children, submissionData)}
        </h6>
      `);
    case 'quote':
      return (`
        <blockquote>
          ${serialize(node.children, submissionData)}
        </blockquote>
      `);
    case 'ul':
      return (`
        <ul>
          ${serialize(node.children, submissionData)}
        </ul>
      `);
    case 'ol':
      return (`
        <ol>
          ${serialize(node.children, submissionData)}
        </ol>
      `);
    case 'li':
      return (`
        <li>
          ${serialize(node.children, submissionData)}
        </li>
      `);
    case 'indent':
      return (`
          <p>
            ${serialize(node.children, submissionData)}
          </p>
        `);
    case 'link':
      return (`
        <a href={${escapeHTML(node.url)}}>
          ${serialize(node.children, submissionData)}
        </a>
      `);

    default:
      return (`
        <p>
          ${serialize(node.children, submissionData)}
        </p>
     `);
  }
}).filter(Boolean).join('');
