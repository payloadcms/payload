import { convertSlateNodesToLexical } from '../../index.js';
export const SlateHeadingConverter = {
  converter({
    converters,
    slateNode
  }) {
    return {
      type: 'heading',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'heading',
        slateNodes: slateNode.children
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      tag: slateNode.type,
      version: 1
    };
  },
  nodeTypes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
};
//# sourceMappingURL=converter.js.map