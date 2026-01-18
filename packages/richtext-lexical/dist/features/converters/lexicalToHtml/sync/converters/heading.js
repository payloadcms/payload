export const HeadingHTMLConverter = {
  heading: ({
    node,
    nodesToHTML,
    providedStyleTag
  }) => {
    const children = nodesToHTML({
      nodes: node.children
    }).join('');
    return `<${node.tag}${providedStyleTag}>${children}</${node.tag}>`;
  }
};
//# sourceMappingURL=heading.js.map