import { jsx as _jsx } from "react/jsx-runtime";
export const OrderableRowDragPreview = ({
  children,
  className,
  rowId
}) => typeof rowId === 'undefined' ? null : /*#__PURE__*/_jsx("div", {
  className: className,
  children: /*#__PURE__*/_jsx("table", {
    cellPadding: 0,
    cellSpacing: 0,
    children: /*#__PURE__*/_jsx("tbody", {
      children: children
    })
  })
});
//# sourceMappingURL=OrderableRowDragPreview.js.map