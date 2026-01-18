'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'table';
export const Table = ({
  appearance,
  BeforeTable,
  columns,
  data
}) => {
  const activeColumns = columns?.filter(col => col?.active);
  if (!activeColumns || activeColumns.length === 0) {
    return /*#__PURE__*/_jsx("div", {
      children: "No columns selected"
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, appearance && `${baseClass}--appearance-${appearance}`].filter(Boolean).join(' '),
    children: [BeforeTable, /*#__PURE__*/_jsxs("table", {
      cellPadding: "0",
      cellSpacing: "0",
      children: [/*#__PURE__*/_jsx("thead", {
        children: /*#__PURE__*/_jsx("tr", {
          children: activeColumns.map((col, i) => /*#__PURE__*/_jsx("th", {
            id: `heading-${col.accessor.replace(/\./g, '__')}`,
            children: col.Heading
          }, i))
        })
      }), /*#__PURE__*/_jsx("tbody", {
        children: data && data?.map((row, rowIndex) => {
          return /*#__PURE__*/_jsx("tr", {
            className: `row-${rowIndex + 1}`,
            "data-id": row.id,
            children: activeColumns.map((col, colIndex) => {
              const {
                accessor
              } = col;
              return /*#__PURE__*/_jsx("td", {
                className: `cell-${accessor.replace(/\./g, '__')}`,
                children: col.renderedCells[rowIndex]
              }, colIndex);
            })
          }, typeof row.id === 'string' || typeof row.id === 'number' ? String(row.id) : rowIndex);
        })
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map