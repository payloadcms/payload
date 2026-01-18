import { convertLexicalPluginNodesToLexical } from '../../index.js';
export const QuoteConverter = {
  converter({
    converters,
    lexicalPluginNode,
    quiet
  }) {
    return {
      ...lexicalPluginNode,
      type: 'quote',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'quote',
        quiet
      }),
      version: 1
    };
  },
  nodeTypes: ['quote']
};
//# sourceMappingURL=converter.js.map