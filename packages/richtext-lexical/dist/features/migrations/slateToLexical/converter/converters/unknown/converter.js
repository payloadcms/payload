import { convertSlateNodesToLexical } from '../../index.js';
export const SlateUnknownConverter = {
  converter({
    converters,
    slateNode
  }) {
    return {
      type: 'unknownConverted',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'unknownConverted',
        slateNodes: slateNode.children
      }),
      data: {
        nodeData: slateNode,
        nodeType: slateNode.type
      },
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    };
  },
  nodeTypes: ['unknown']
};
//# sourceMappingURL=converter.js.map