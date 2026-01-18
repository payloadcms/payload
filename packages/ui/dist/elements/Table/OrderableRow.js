import { jsx as _jsx } from "react/jsx-runtime";
export const OrderableRow = ({
  cellMap,
  columns,
  dragAttributes = {},
  dragListeners = {},
  rowId,
  ...rest
}) => /*#__PURE__*/_jsx("tr", {
  ...rest,
  children: columns.map((col, colIndex) => {
    const {
      accessor
    } = col;
    // Use the cellMap to find which index in the renderedCells to use
    const cell = col.renderedCells[cellMap[rowId]];
    // For drag handles, wrap in div with drag attributes
    if (accessor === '_dragHandle') {
      return /*#__PURE__*/_jsx("td", {
        className: `cell-${accessor}`,
        children: /*#__PURE__*/_jsx("div", {
          ...dragAttributes,
          ...dragListeners,
          children: cell
        })
      }, colIndex);
    }
    return /*#__PURE__*/_jsx("td", {
      className: `cell-${accessor}`,
      children: cell
    }, colIndex);
  })
});
//# sourceMappingURL=OrderableRow.js.map