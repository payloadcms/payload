export const BlockquoteHTMLConverterAsync = {
  quote: async ({
    node,
    nodesToHTML,
    providedStyleTag
  }) => {
    const children = (await nodesToHTML({
      nodes: node.children
    })).join('');
    return `<blockquote${providedStyleTag}>${children}</blockquote>`;
  }
};
//# sourceMappingURL=blockquote.js.map