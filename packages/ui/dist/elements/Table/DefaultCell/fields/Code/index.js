'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
export const CodeCell = ({
  cellData,
  nowrap
}) => {
  const textToShow = cellData?.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData;
  const noWrapStyle = nowrap ? {
    whiteSpace: 'nowrap'
  } : {};
  return /*#__PURE__*/_jsx("code", {
    className: "code-cell",
    style: noWrapStyle,
    children: /*#__PURE__*/_jsx("span", {
      children: textToShow
    })
  });
};
//# sourceMappingURL=index.js.map