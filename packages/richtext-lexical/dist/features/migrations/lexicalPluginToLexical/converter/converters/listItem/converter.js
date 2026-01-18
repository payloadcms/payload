import { convertLexicalPluginNodesToLexical } from '../../index.js';
export const ListItemConverter = {
  converter({
    childIndex,
    converters,
    lexicalPluginNode,
    quiet
  }) {
    return {
      ...lexicalPluginNode,
      type: 'listitem',
      checked: undefined,
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'listitem',
        quiet
      }),
      value: childIndex + 1,
      version: 1
    };
  },
  nodeTypes: ['listitem']
};
//# sourceMappingURL=converter.js.map