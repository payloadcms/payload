import { jsx as _jsx } from "react/jsx-runtime";
import { toWords, transformColumnsToSearchParams } from 'payload/shared';
import React from 'react';
import { Pill } from '../../../Pill/index.js';
import './index.scss';
const baseClass = 'query-preset-columns-cell';
export const QueryPresetsColumnsCell = ({
  cellData
}) => {
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: cellData ? transformColumnsToSearchParams(cellData).map((column, i) => {
      const isColumnActive = !column.startsWith('-');
      // to void very lengthy cells, only display the active columns
      if (!isColumnActive) {
        return null;
      }
      return /*#__PURE__*/_jsx(Pill, {
        pillStyle: isColumnActive ? 'always-white' : 'light',
        size: "small",
        children: toWords(column)
      }, i);
    }) : 'No columns selected'
  });
};
//# sourceMappingURL=index.js.map