import { Text } from 'slate';

export const stringifyRichText = (content: unknown): string => {
  if (Array.isArray(content)) {
    return content.reduce((output, node) => {
      const isTextNode = Text.isText(node);

      const {
        text,
      } = node;

      if (isTextNode) {
        // convert straight single quotations to curly
        // "\u201C" is starting double curly
        // "\u201D" is ending double curly
        const sanitizedText = text?.replace(/'/g, '\u2019'); // single quotes
        return `${output}${sanitizedText}`;
      }

      if (node) {
        let nodeHTML;
        switch (node.type) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
          case 'li':
          case 'p':
          case undefined:
            nodeHTML = `${stringifyRichText(node.children)}\n`;
            break;

          case 'ul':
          case 'ol':
            nodeHTML = `${stringifyRichText(node.children)}\n\n`;
            break;

          case 'link':
            nodeHTML = `${stringifyRichText(node.children)}`;
            break;

          case 'relationship':
            nodeHTML = `Relationship to ${node.relationTo}: ${node?.value?.id}\n\n`;
            break;

          case 'upload':
            nodeHTML = `${node.relationTo} Upload: ${node?.value?.id}\n\n`;
            break;

          default:
            nodeHTML = `${node.type}: ${JSON.stringify(node)}\n\n`;
            break;
        }

        return `${output}${nodeHTML}`;
      }

      return output;
    }, '');
  }

  return '';
};
