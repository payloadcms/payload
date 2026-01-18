export const ParagraphHTMLConverterAsync = {
  paragraph: async ({
    node,
    nodesToHTML,
    providedStyleTag
  }) => {
    const children = await nodesToHTML({
      nodes: node.children
    });
    if (!children?.length) {
      return `<p${providedStyleTag}><br /></p>`;
    }
    return `<p${providedStyleTag}>${children.join('')}</p>`;
  }
};
//# sourceMappingURL=paragraph.js.map