'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const TextareaCell = ({
  cellData
}) => {
  const textToShow = cellData?.length > 100 ? `${cellData.substring(0, 100)}\u2026` : cellData;
  return /*#__PURE__*/_jsx("span", {
    children: textToShow
  });
};
//# sourceMappingURL=index.js.map