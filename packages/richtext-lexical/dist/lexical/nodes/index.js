export function getEnabledNodes({
  editorConfig
}) {
  return getEnabledNodesFromServerNodes({
    nodes: editorConfig.features.nodes
  });
}
export function getEnabledNodesFromServerNodes({
  nodes
}) {
  return nodes.map(node => {
    if ('node' in node) {
      return node.node;
    }
    return node;
  });
}
//# sourceMappingURL=index.js.map