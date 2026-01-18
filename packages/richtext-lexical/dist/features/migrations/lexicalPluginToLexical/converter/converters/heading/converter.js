import { convertLexicalPluginNodesToLexical } from '../../index.js';
export const HeadingConverter = {
  converter({
    converters,
    lexicalPluginNode,
    quiet
  }) {
    return {
      ...lexicalPluginNode,
      type: 'heading',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'heading',
        quiet
      }),
      version: 1
    };
  },
  nodeTypes: ['heading']
};
//# sourceMappingURL=converter.js.map