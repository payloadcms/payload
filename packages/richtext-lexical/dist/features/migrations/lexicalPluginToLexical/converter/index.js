export function convertLexicalPluginToLexical({
  converters,
  lexicalPluginData,
  quiet
}) {
  return {
    root: {
      type: 'root',
      children: convertLexicalPluginNodesToLexical({
        converters,
        lexicalPluginNodes: lexicalPluginData?.jsonContent?.root?.children || [],
        parentNodeType: 'root',
        quiet
      }),
      direction: lexicalPluginData?.jsonContent?.root?.direction || 'ltr',
      format: lexicalPluginData?.jsonContent?.root?.format || '',
      indent: lexicalPluginData?.jsonContent?.root?.indent || 0,
      version: 1
    }
  };
}
export function convertLexicalPluginNodesToLexical({
  converters,
  lexicalPluginNodes,
  parentNodeType,
  quiet
}) {
  if (!lexicalPluginNodes?.length || !converters?.length) {
    return [];
  }
  const unknownConverter = converters.find(converter => converter.nodeTypes.includes('unknown'));
  // @ts-expect-error - vestiges of the migration to strict mode. Probably not important enough in this file to fix
  return lexicalPluginNodes.map((lexicalPluginNode, i) => {
    if (lexicalPluginNode.type === 'paragraph') {
      return convertParagraphNode(converters, lexicalPluginNode, quiet);
    }
    if (lexicalPluginNode.type === 'text' || !lexicalPluginNode.type) {
      return convertTextNode(lexicalPluginNode);
    }
    const converter = converters.find(converter => converter.nodeTypes.includes(lexicalPluginNode.type));
    if (converter) {
      return converter.converter({
        childIndex: i,
        converters,
        lexicalPluginNode,
        parentNodeType,
        quiet
      });
    }
    if (!quiet) {
      console.warn('lexicalPluginToLexical > No converter found for node type: ' + lexicalPluginNode.type);
    }
    return unknownConverter?.converter({
      childIndex: i,
      converters,
      lexicalPluginNode,
      parentNodeType,
      quiet
    });
  }) || [];
}
export function convertParagraphNode(converters, node, quiet) {
  return {
    ...node,
    type: 'paragraph',
    children: convertLexicalPluginNodesToLexical({
      converters,
      lexicalPluginNodes: node.children || [],
      parentNodeType: 'paragraph',
      quiet
    }),
    version: 1
  };
}
export function convertTextNode(node) {
  return node;
}
//# sourceMappingURL=index.js.map