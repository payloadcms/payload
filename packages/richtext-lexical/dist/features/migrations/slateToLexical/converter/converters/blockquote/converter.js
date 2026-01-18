import { convertSlateNodesToLexical } from '../../index.js';
export const SlateBlockquoteConverter = {
  converter({
    converters,
    slateNode
  }) {
    return {
      type: 'quote',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'quote',
        slateNodes: slateNode.children
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    };
  },
  nodeTypes: ['blockquote']
};
//# sourceMappingURL=converter.js.map