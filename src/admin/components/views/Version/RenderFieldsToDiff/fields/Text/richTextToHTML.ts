import { Text } from 'slate';

export const richTextToHTML = (content: unknown): string => {
  if (Array.isArray(content)) {
    return content.reduce((output, node) => {
      const isTextNode = Text.isText(node);

      const {
        text,
        bold,
        code,
        italic,
        underline,
        strikethrough,
      } = node;

      if (isTextNode) {
        // convert straight single quotations to curly
        // "\u201C" is starting double curly
        // "\u201D" is ending double curly
        let html = text?.replace(/'/g, '\u2019'); // single quotes

        if (bold) {
          html = `<strong>${html}</strong>`;
        }

        if (code) {
          html = `<code>${html}</code>`;
        }

        if (italic) {
          html = `<em>${html}</em>`;
        }

        if (underline) {
          html = `<span style="text-decoration: underline;">${html}</span>`;
        }

        if (strikethrough) {
          html = `<span style="text-decoration: line-through;">${html}</span>`;
        }

        return `${output}${html}`;
      }

      if (node) {
        let nodeHTML;
        switch (node.type) {
          case 'h1':
            nodeHTML = `<h1>${richTextToHTML(node.children)}</h1>`;
            break;

          case 'h2':
            nodeHTML = `<h2>${richTextToHTML(node.children)}</h2>`;
            break;

          case 'h3':
            nodeHTML = `<h3>${richTextToHTML(node.children)}</h3>`;
            break;

          case 'h4':
            nodeHTML = `<h4>${richTextToHTML(node.children)}</h4>`;
            break;

          case 'h5':
            nodeHTML = `<h5>${richTextToHTML(node.children)}</h5>`;
            break;

          case 'h6':
            nodeHTML = `<h6>${richTextToHTML(node.children)}</h6>`;
            break;

          case 'blockquote':
            nodeHTML = `<blockquote>${richTextToHTML(node.children)}</blockquote>`;
            break;

          case 'ul':
            nodeHTML = `<ul>${richTextToHTML(node.children)}</ul>`;
            break;

          case 'ol':
            nodeHTML = `<ol>${richTextToHTML(node.children)}</ol>`;
            break;

          case 'li':
            nodeHTML = `<li>${richTextToHTML(node.children)}</li>`;
            break;

          case 'link':
            nodeHTML = `<a href="${node.url}">${richTextToHTML(node.children)}</a>`;
            break;

          case 'relationship':
            nodeHTML = `<strong>Relationship to ${node.relationTo}: ${node.value}</strong><br/>`;
            break;

          case 'upload':
            nodeHTML = `<strong>${node.relationTo} Upload: ${node.value}</strong><br/>`;
            break;

          case 'p':
          case undefined:
            nodeHTML = `<p>${richTextToHTML(node.children)}</p>`;
            break;

          default:
            nodeHTML = `<strong>${node.type}</strong>:<br/>${JSON.stringify(node)}`;
            break;
        }

        return `${output}${nodeHTML}\n`;
      }

      return output;
    }, '');
  }

  return '';
};
