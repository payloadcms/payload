export const HeadingHTMLConverterAsync = {
  heading: async ({
    node,
    nodesToHTML,
    providedStyleTag
  }) => {
    const children = (await nodesToHTML({
      nodes: node.children
    })).join('');
    return `<${node.tag}${providedStyleTag}>${children}</${node.tag}>`;
  }
};
//# sourceMappingURL=heading.js.map