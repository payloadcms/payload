import { jsx as _jsx } from "react/jsx-runtime";
export const BlockquoteJSXConverter = {
  quote: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    return /*#__PURE__*/_jsx("blockquote", {
      children: children
    });
  }
};
//# sourceMappingURL=blockquote.js.map