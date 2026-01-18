// Initialize both flattenedNodes and nodeIDMap
export const recurseNodeTree = ({
  flattenedNodes,
  nodeIDMap,
  nodes
}) => {
  if (!nodes?.length) {
    return;
  }
  for (const node of nodes) {
    if (flattenedNodes) {
      flattenedNodes.push(node);
    }
    if (nodeIDMap) {
      if (node && 'id' in node && node.id) {
        nodeIDMap[node.id] = node;
      } else if ('fields' in node && typeof node.fields === 'object' && node.fields && 'id' in node.fields && node?.fields?.id) {
        nodeIDMap[node.fields.id] = node;
      }
    }
    if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
      recurseNodeTree({
        flattenedNodes,
        nodeIDMap,
        nodes: node.children
      });
    }
  }
};
//# sourceMappingURL=recurseNodeTree.js.map