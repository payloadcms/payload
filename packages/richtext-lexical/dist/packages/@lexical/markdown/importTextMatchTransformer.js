export function findOutermostTextMatchTransformer(textNode_, textMatchTransformers) {
  const textNode = textNode_;
  let foundMatchStartIndex = undefined;
  let foundMatchEndIndex = undefined;
  let foundMatchTransformer = undefined;
  let foundMatch = undefined;
  for (const transformer of textMatchTransformers) {
    if (!transformer.replace || !transformer.importRegExp) {
      continue;
    }
    const match = textNode.getTextContent().match(transformer.importRegExp);
    if (!match) {
      continue;
    }
    const startIndex = match.index || 0;
    const endIndex = transformer.getEndIndex ? transformer.getEndIndex(textNode, match) : startIndex + match[0].length;
    if (endIndex === false) {
      continue;
    }
    if (foundMatchStartIndex === undefined || foundMatchEndIndex === undefined || startIndex < foundMatchStartIndex && endIndex > foundMatchEndIndex) {
      foundMatchStartIndex = startIndex;
      foundMatchEndIndex = endIndex;
      foundMatchTransformer = transformer;
      foundMatch = match;
    }
  }
  if (foundMatchStartIndex === undefined || foundMatchEndIndex === undefined || foundMatchTransformer === undefined || foundMatch === undefined) {
    return null;
  }
  return {
    endIndex: foundMatchEndIndex,
    match: foundMatch,
    startIndex: foundMatchStartIndex,
    transformer: foundMatchTransformer
  };
}
export function importFoundTextMatchTransformer(textNode, startIndex, endIndex, transformer, match) {
  let nodeAfter, nodeBefore, transformedNode;
  if (startIndex === 0) {
    [transformedNode, nodeAfter] = textNode.splitText(endIndex);
  } else {
    [nodeBefore, transformedNode, nodeAfter] = textNode.splitText(startIndex, endIndex);
  }
  if (!transformer.replace) {
    return null;
  }
  const potentialTransformedNode = transformedNode ? transformer.replace(transformedNode, match) : undefined;
  return {
    nodeAfter,
    nodeBefore,
    transformedNode: potentialTransformedNode || undefined
  };
}
//# sourceMappingURL=importTextMatchTransformer.js.map