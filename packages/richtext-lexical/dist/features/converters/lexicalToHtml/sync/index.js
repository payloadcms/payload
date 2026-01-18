/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable no-console */import { hasText } from '../../../../validate/hasText.js';
import { findConverterForNode } from '../shared/findConverterForNode.js';
import { defaultHTMLConverters } from './defaultConverters.js';
export function convertLexicalToHTML({
  className,
  converters,
  data,
  disableContainer,
  disableIndent,
  disableTextAlign
}) {
  if (hasText(data)) {
    let finalConverters = {};
    if (converters) {
      if (typeof converters === 'function') {
        finalConverters = converters({
          defaultConverters: defaultHTMLConverters
        });
      } else {
        finalConverters = converters;
      }
    } else {
      finalConverters = defaultHTMLConverters;
    }
    const html = convertLexicalNodesToHTML({
      converters: finalConverters,
      disableIndent,
      disableTextAlign,
      nodes: data?.root?.children,
      parent: data?.root
    }).join('');
    if (disableContainer) {
      return html;
    } else {
      return `<div class="${className ?? 'payload-richtext'}">${html}</div>`;
    }
  }
  if (disableContainer) {
    return '';
  } else {
    return `<div class="${className ?? 'payload-richtext'}"></div>`;
  }
}
export function convertLexicalNodesToHTML({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent
}) {
  const unknownConverter = converters.unknown;
  const htmlArray = [];
  let i = -1;
  for (const node of nodes) {
    i++;
    const {
      converterForNode,
      providedCSSString,
      providedStyleTag
    } = findConverterForNode({
      converters,
      disableIndent,
      disableTextAlign,
      node,
      unknownConverter
    });
    try {
      let nodeHTML;
      if (converterForNode) {
        const converted = typeof converterForNode === 'function' ? converterForNode({
          childIndex: i,
          converters,
          node,
          nodesToHTML: args => {
            return convertLexicalNodesToHTML({
              converters: args.converters ?? converters,
              disableIndent: args.disableIndent ?? disableIndent,
              disableTextAlign: args.disableTextAlign ?? disableTextAlign,
              nodes: args.nodes,
              parent: args.parent ?? {
                ...node,
                parent
              }
            });
          },
          parent,
          providedCSSString,
          providedStyleTag
        }) : converterForNode;
        nodeHTML = converted;
      } else {
        nodeHTML = '<span>unknown node</span>';
      }
      htmlArray.push(nodeHTML);
    } catch (error) {
      console.error('Error converting lexical node to HTML:', error, 'node:', node);
      htmlArray.push('');
    }
  }
  return htmlArray.filter(Boolean);
}
//# sourceMappingURL=index.js.map