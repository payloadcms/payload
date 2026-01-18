/* eslint-disable no-console */import { hasText } from '../../../../validate/hasText.js';
import { findConverterForNode } from '../shared/findConverterForNode.js';
export function convertLexicalToPlaintext({
  converters,
  data
}) {
  if (hasText(data)) {
    const plaintext = convertLexicalNodesToPlaintext({
      converters: converters ?? {},
      nodes: data?.root?.children,
      parent: data?.root
    }).join('');
    return plaintext;
  }
  return '';
}
export function convertLexicalNodesToPlaintext({
  converters,
  nodes,
  parent
}) {
  const plainTextArray = [];
  let i = -1;
  for (const node of nodes) {
    i++;
    const converter = findConverterForNode({
      converters,
      node
    });
    if (converter) {
      try {
        const converted = typeof converter === 'function' ? converter({
          childIndex: i,
          converters,
          node,
          nodesToPlaintext: args => {
            return convertLexicalNodesToPlaintext({
              converters: args.converters ?? converters,
              nodes: args.nodes,
              parent: args.parent ?? {
                ...node,
                parent
              }
            });
          },
          parent
        }) : converter;
        if (converted && typeof converted === 'string') {
          plainTextArray.push(converted);
        }
      } catch (error) {
        console.error('Error converting lexical node to plaintext:', error, 'node:', node);
      }
    } else {
      // Default plaintext converter heuristic
      if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'list' || node.type === 'table') {
        if (plainTextArray?.length) {
          // Only add a new line if there is already text in the array
          plainTextArray.push('\n\n');
        }
      } else if (node.type === 'listitem' || node.type === 'tablerow') {
        if (plainTextArray?.length) {
          // Only add a new line if there is already text in the array
          plainTextArray.push('\n');
        }
      } else if (node.type === 'tablecell') {
        if (plainTextArray?.length) {
          plainTextArray.push(' | ');
        }
      } else if (node.type === 'linebreak') {
        plainTextArray.push('\n');
      } else if (node.type === 'tab') {
        plainTextArray.push('\t');
      } else if ('text' in node && node.text) {
        plainTextArray.push(node.text);
      }
      if ('children' in node && node.children) {
        plainTextArray.push(...convertLexicalNodesToPlaintext({
          converters,
          nodes: node.children,
          parent: node
        }));
      }
    }
  }
  return plainTextArray.filter(Boolean);
}
//# sourceMappingURL=index.js.map