'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { EditIcon } from '../../../../icons/Edit/index.js';
import { useCellProps } from '../../../../providers/TableColumns/RenderDefaultCell/index.js';
import { DefaultCell } from '../../../Table/DefaultCell/index.js';
import './index.scss';
export const DrawerLink = t0 => {
  const $ = _c(3);
  const {
    onDrawerOpen
  } = t0;
  const cellProps = useCellProps();
  let t1;
  if ($[0] !== cellProps || $[1] !== onDrawerOpen) {
    t1 = _jsxs("div", {
      className: "drawer-link",
      children: [_jsx(DefaultCell, {
        ...cellProps,
        className: "drawer-link__cell",
        link: false,
        onClick: null
      }), _jsx("button", {
        className: "drawer-link__doc-drawer-toggler",
        onClick: () => {
          onDrawerOpen(cellProps.rowData.id);
        },
        type: "button",
        children: _jsx(EditIcon, {})
      })]
    });
    $[0] = cellProps;
    $[1] = onDrawerOpen;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
//# sourceMappingURL=index.js.map