import { convertSlateNodesToLexical } from '../../index.js';
export const SlateListItemConverter = {
  converter({
    childIndex,
    converters,
    slateNode
  }) {
    return {
      type: 'listitem',
      checked: undefined,
      children: convertSlateNodesToLexical({
        canContainParagraphs: false,
        converters,
        parentNodeType: 'listitem',
        slateNodes: slateNode.children
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      value: childIndex + 1,
      version: 1
    };
  },
  nodeTypes: ['li']
};
//# sourceMappingURL=converter.js.map