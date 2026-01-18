export function recurseNodes({
  callback,
  nodes
}) {
  for (const node of nodes) {
    callback(node);
    if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
      recurseNodes({
        callback,
        nodes: node.children
      });
    }
  }
}
export async function recurseNodesAsync({
  callback,
  nodes
}) {
  for (const node of nodes) {
    await callback(node);
    if ('children' in node && Array.isArray(node?.children) && node?.children?.length) {
      await recurseNodesAsync({
        callback,
        nodes: node.children
      });
    }
  }
}
//# sourceMappingURL=forEachNodeRecursively.js.map