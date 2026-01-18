'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { RowLabelProvider } from './Context/index.js';
const baseClass = 'row-label';
export const RowLabel = props => {
  const {
    className,
    CustomComponent,
    label,
    path,
    rowNumber
  } = props;
  return /*#__PURE__*/_jsx(RowLabelProvider, {
    path: path,
    rowNumber: rowNumber,
    children: /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: CustomComponent,
      Fallback: typeof label === 'string' ? /*#__PURE__*/_jsx("span", {
        className: [baseClass, className].filter(Boolean).join(' '),
        style: {
          pointerEvents: 'none'
        },
        children: label
      }) : label
    })
  });
};
//# sourceMappingURL=index.js.map