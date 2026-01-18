export const createBlockNode = createNode => {
  return (parentNode, children, match) => {
    const node = createNode(match);
    if (node) {
      node.append(...children);
      parentNode.replace(node);
      node.select(0, 0);
    }
  };
};
//# sourceMappingURL=createBlockNode.js.map