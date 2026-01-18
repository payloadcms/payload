import { jsx as _jsx } from "react/jsx-runtime";
export const ParagraphJSXConverter = {
  paragraph: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    if (!children?.length) {
      return /*#__PURE__*/_jsx("p", {
        children: /*#__PURE__*/_jsx("br", {})
      });
    }
    return /*#__PURE__*/_jsx("p", {
      children: children
    });
  }
};
//# sourceMappingURL=paragraph.js.map