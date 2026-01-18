import { convertSlateNodesToLexical } from '../../index.js';
export const SlateUnorderedListConverter = {
  converter({
    converters,
    slateNode
  }) {
    return {
      type: 'list',
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'list',
        slateNodes: slateNode.children
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      listType: 'bullet',
      start: 1,
      tag: 'ul',
      version: 1
    };
  },
  nodeTypes: ['ul']
};
//# sourceMappingURL=converter.js.map