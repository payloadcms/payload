import { jsx as _jsx } from "react/jsx-runtime";
export const HeadingJSXConverter = {
  heading: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    const NodeTag = node.tag;
    return /*#__PURE__*/_jsx(NodeTag, {
      children: children
    });
  }
};
//# sourceMappingURL=heading.js.map