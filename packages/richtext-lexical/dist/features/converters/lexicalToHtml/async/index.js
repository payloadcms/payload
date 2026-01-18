/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable no-console */import { hasText } from '../../../../validate/hasText.js';
import { findConverterForNode } from '../shared/findConverterForNode.js';
import { defaultHTMLConvertersAsync } from './defaultConverters.js';
export async function convertLexicalToHTMLAsync({
  className,
  converters,
  data,
  disableContainer,
  disableIndent,
  disableTextAlign,
  populate
}) {
  if (hasText(data)) {
    let finalConverters = {};
    if (converters) {
      if (typeof converters === 'function') {
        finalConverters = converters({
          defaultConverters: defaultHTMLConvertersAsync
        });
      } else {
        finalConverters = converters;
      }
    } else {
      finalConverters = defaultHTMLConvertersAsync;
    }
    const html = (await convertLexicalNodesToHTMLAsync({
      converters: finalConverters,
      disableIndent,
      disableTextAlign,
      nodes: data?.root?.children,
      parent: data?.root,
      populate
    })).join('');
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
export async function convertLexicalNodesToHTMLAsync({
  converters,
  disableIndent,
  disableTextAlign,
  nodes,
  parent,
  populate
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
        const converted = typeof converterForNode === 'function' ? await converterForNode({
          childIndex: i,
          converters,
          node,
          populate,
          nodesToHTML: async args => {
            return await convertLexicalNodesToHTMLAsync({
              converters: args.converters ?? converters,
              disableIndent: args.disableIndent ?? disableIndent,
              disableTextAlign: args.disableTextAlign ?? disableTextAlign,
              nodes: args.nodes,
              parent: args.parent ?? {
                ...node,
                parent
              },
              populate
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