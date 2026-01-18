import { convertSlateNodesToLexical } from '../../index.js';
export const SlateIndentConverter = {
  converter({
    converters,
    slateNode
  }) {
    const convertChildren = (node, indentLevel = 0) => {
      if (node?.type && (!node.children || node.type !== 'indent') || !node?.type && node?.text) {
        return {
          ...convertSlateNodesToLexical({
            canContainParagraphs: false,
            converters,
            parentNodeType: 'indent',
            slateNodes: [node]
          })[0],
          indent: indentLevel
        };
      }
      const children = node.children.map(child => convertChildren(child, indentLevel + 1));
      return {
        type: 'paragraph',
        children,
        direction: 'ltr',
        format: '',
        indent: indentLevel,
        version: 1
      };
    };
    return convertChildren(slateNode);
  },
  nodeTypes: ['indent']
};
//# sourceMappingURL=converter.js.map