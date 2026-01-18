import { createLocalReq } from 'payload';
import { hasText } from '../../../../validate/hasText.js';
/**
 * @deprecated - will be removed in 4.0. Use the function exported from `@payloadcms/richtext-lexical/html` instead.
 * @example
 * ```ts
 * // old (deprecated)
 * import { convertLexicalToHTML } from '@payloadcms/richtext-lexical'
 * // new (recommended)
 * import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
 * ```
 * For more details, you can refer to https://payloadcms.com/docs/rich-text/converting-html to see all the
 * ways to convert lexical to HTML.
 */
export async function convertLexicalToHTML({
  converters,
  currentDepth,
  data,
  depth,
  draft,
  overrideAccess,
  payload,
  req,
  showHiddenFields
}) {
  if (hasText(data)) {
    if (req === undefined && payload) {
      req = await createLocalReq({}, payload);
    }
    if (!currentDepth) {
      currentDepth = 0;
    }
    if (!depth) {
      depth = req?.payload?.config?.defaultDepth;
    }
    return await convertLexicalNodesToHTML({
      converters,
      currentDepth,
      depth: depth,
      draft: draft === undefined ? false : draft,
      lexicalNodes: data?.root?.children,
      overrideAccess: overrideAccess === undefined ? false : overrideAccess,
      parent: data?.root,
      req: req,
      showHiddenFields: showHiddenFields === undefined ? false : showHiddenFields
    });
  }
  return '';
}
/**
 * @deprecated - will be removed in 4.0
 */
export async function convertLexicalNodesToHTML({
  converters,
  currentDepth,
  depth,
  draft,
  lexicalNodes,
  overrideAccess,
  parent,
  req,
  showHiddenFields
}) {
  const unknownConverter = converters.find(converter => converter.nodeTypes.includes('unknown'));
  const htmlArray = await Promise.all(lexicalNodes.map(async (node, i) => {
    const converterForNode = converters.find(converter => converter.nodeTypes.includes(node.type));
    try {
      if (!converterForNode) {
        if (unknownConverter) {
          return await unknownConverter.converter({
            childIndex: i,
            converters,
            currentDepth,
            depth,
            draft,
            node,
            overrideAccess,
            parent,
            req,
            showHiddenFields
          });
        }
        return '<span>unknown node</span>';
      }
      return await converterForNode.converter({
        childIndex: i,
        converters,
        currentDepth,
        depth,
        draft,
        node,
        overrideAccess,
        parent,
        req,
        showHiddenFields
      });
    } catch (error) {
      console.error('Error converting lexical node to HTML:', error, 'node:', node);
      return '';
    }
  }));
  return htmlArray.join('') || '';
}
//# sourceMappingURL=index.js.map