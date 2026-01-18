/* eslint-disable @typescript-eslint/no-explicit-any */import { convertLexicalPluginNodesToLexical } from '../../index.js';
export const ListConverter = {
  converter({
    converters,
    lexicalPluginNode,
    quiet
  }) {
    return {
      ...lexicalPluginNode,
      type: 'list',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'list',
        quiet
      }),
      listType: lexicalPluginNode?.listType || 'number',
      tag: lexicalPluginNode?.tag || 'ol',
      version: 1
    };
  },
  nodeTypes: ['list']
};
//# sourceMappingURL=converter.js.map