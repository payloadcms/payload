export const ParagraphHTMLConverter = {
  paragraph: ({
    node,
    nodesToHTML,
    providedStyleTag
  }) => {
    const children = nodesToHTML({
      nodes: node.children
    });
    if (!children?.length) {
      return `<p${providedStyleTag}><br /></p>`;
    }
    return `<p${providedStyleTag}>${children.join('')}</p>`;
  }
};
//# sourceMappingURL=paragraph.js.map