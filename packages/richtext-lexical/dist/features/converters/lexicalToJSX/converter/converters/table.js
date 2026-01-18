import { jsx as _jsx } from "react/jsx-runtime";
export const TableJSXConverter = {
  table: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    return /*#__PURE__*/_jsx("div", {
      className: "lexical-table-container",
      children: /*#__PURE__*/_jsx("table", {
        className: "lexical-table",
        style: {
          borderCollapse: 'collapse'
        },
        children: /*#__PURE__*/_jsx("tbody", {
          children: children
        })
      })
    });
  },
  tablecell: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    const TagName = node.headerState > 0 ? 'th' : 'td' // Use capital letter to denote a component
    ;
    const headerStateClass = `lexical-table-cell-header-${node.headerState}`;
    const style = {
      backgroundColor: node.backgroundColor || undefined,
      border: '1px solid #ccc',
      padding: '8px'
    };
    // Note: JSX does not support setting attributes directly as strings, so you must convert the colSpan and rowSpan to numbers
    const colSpan = node.colSpan && node.colSpan > 1 ? node.colSpan : undefined;
    const rowSpan = node.rowSpan && node.rowSpan > 1 ? node.rowSpan : undefined;
    return /*#__PURE__*/_jsx(TagName, {
      className: `lexical-table-cell ${headerStateClass}`,
      colSpan: colSpan,
      rowSpan: rowSpan,
      style: style,
      children: children
    });
  },
  tablerow: ({
    node,
    nodesToJSX
  }) => {
    const children = nodesToJSX({
      nodes: node.children
    });
    return /*#__PURE__*/_jsx("tr", {
      className: "lexical-table-row",
      children: children
    });
  }
};
//# sourceMappingURL=table.js.map