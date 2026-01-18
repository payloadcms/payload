import { jsx as _jsx } from "react/jsx-runtime";
export const LinkJSXConverter = ({
  internalDocToHref
}) => ({
  autolink: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    const rel = node.fields.newTab ? 'noopener noreferrer' : undefined;
    const target = node.fields.newTab ? '_blank' : undefined;
    return /*#__PURE__*/_jsx("a", {
      href: node.fields.url,
      rel,
      target,
      children: children
    });
  },
  link: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    const rel = node.fields.newTab ? 'noopener noreferrer' : undefined;
    const target = node.fields.newTab ? '_blank' : undefined;
    let href = node.fields.url ?? '';
    if (node.fields.linkType === 'internal') {
      if (internalDocToHref) {
        href = internalDocToHref({
          linkNode: node
        });
      } else {
        console.error('Lexical => JSX converter: Link converter: found internal link, but internalDocToHref is not provided');
        href = '#'; // fallback
      }
    }
    return /*#__PURE__*/_jsx("a", {
      href: href,
      rel,
      target,
      children: children
    });
  }
});
//# sourceMappingURL=link.js.map