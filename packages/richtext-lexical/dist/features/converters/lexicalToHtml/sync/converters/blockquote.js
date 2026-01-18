export const BlockquoteHTMLConverter = {
  quote: ({
    node,
    nodesToHTML,
    providedStyleTag
  }) => {
    const children = nodesToHTML({
      nodes: node.children
    }).join('');
    return `<blockquote${providedStyleTag}>${children}</blockquote>`;
  }
};
//# sourceMappingURL=blockquote.js.map