export function findConverterForNode({
  converters,
  node
}) {
  let converterForNode;
  if (node.type === 'block') {
    converterForNode = converters?.blocks?.[node?.fields?.blockType];
  } else if (node.type === 'inlineBlock') {
    converterForNode = converters?.inlineBlocks?.[node?.fields?.blockType];
  } else {
    converterForNode = converters[node.type];
  }
  return converterForNode;
}
//# sourceMappingURL=findConverterForNode.js.map