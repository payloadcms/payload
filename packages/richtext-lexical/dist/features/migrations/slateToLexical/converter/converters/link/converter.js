import { convertSlateNodesToLexical } from '../../index.js';
export const SlateLinkConverter = {
  converter({
    converters,
    slateNode
  }) {
    return {
      type: 'link',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'link',
        slateNodes: slateNode.children
      }),
      direction: 'ltr',
      fields: {
        ...(slateNode.fields || {}),
        doc: slateNode.doc || null,
        linkType: slateNode.linkType || 'custom',
        newTab: slateNode.newTab || false,
        url: (slateNode.linkType || 'custom') === 'custom' ? slateNode.url || 'https' : undefined
      },
      format: '',
      indent: 0,
      version: 2
    };
  },
  nodeTypes: ['link']
};
//# sourceMappingURL=converter.js.map