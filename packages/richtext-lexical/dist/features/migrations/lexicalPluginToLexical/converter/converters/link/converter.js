/* eslint-disable @typescript-eslint/no-explicit-any */import { convertLexicalPluginNodesToLexical } from '../../index.js';
export const LinkConverter = {
  converter({
    converters,
    lexicalPluginNode,
    quiet
  }) {
    return {
      type: 'link',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginNode.children,
        parentNodeType: 'link',
        quiet
      }),
      direction: lexicalPluginNode.direction || 'ltr',
      fields: {
        doc: lexicalPluginNode.attributes?.doc ? {
          relationTo: lexicalPluginNode.attributes?.doc?.relationTo,
          value: lexicalPluginNode.attributes?.doc?.value
        } : undefined,
        linkType: lexicalPluginNode.attributes?.linkType || 'custom',
        newTab: lexicalPluginNode.attributes?.newTab || false,
        url: lexicalPluginNode.attributes?.url || undefined
      },
      format: lexicalPluginNode.format || '',
      indent: lexicalPluginNode.indent || 0,
      version: 2
    };
  },
  nodeTypes: ['link']
};
//# sourceMappingURL=converter.js.map