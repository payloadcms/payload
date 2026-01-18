export async function validateNodes({
  nodes,
  nodeValidations,
  validation: validationFromProps
}) {
  for (const node of nodes) {
    // Validate node
    const validations = nodeValidations.get(node.type);
    if (validations) {
      for (const validation of validations) {
        const validationResult = await validation({
          node,
          nodeValidations,
          validation: validationFromProps
        });
        if (validationResult !== true) {
          return `${node.type} node failed to validate: ${validationResult}`;
        }
      }
    }
    // Validate node's children
    if ('children' in node && node?.children) {
      const childrenValidationResult = await validateNodes({
        nodes: node.children,
        nodeValidations,
        validation: validationFromProps
      });
      if (childrenValidationResult !== true) {
        return childrenValidationResult;
      }
    }
  }
  return true;
}
//# sourceMappingURL=validateNodes.js.map