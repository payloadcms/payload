import { convertLexicalPluginNodesToLexical } from '../../index.js';
export const UnknownConverter = {
  converter({
    converters,
    lexicalPluginNode,
    quiet
  }) {
    return {
      type: 'unknownConverted',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'unknownConverted',
        quiet
      }),
      data: {
        nodeData: lexicalPluginNode,
        nodeType: lexicalPluginNode.type
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