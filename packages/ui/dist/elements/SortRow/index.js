'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { DragHandleIcon } from '../../icons/DragHandle/index.js';
import './index.scss';
import { useListQuery } from '../../providers/ListQuery/index.js';
const baseClass = 'sort-row';
export const SortRow = () => {
  const $ = _c(2);
  const {
    orderableFieldName,
    query
  } = useListQuery();
  const isActive = query.sort === orderableFieldName || query.sort === `-${orderableFieldName}`;
  const t0 = `${baseClass} ${isActive ? "active" : ""}`;
  let t1;
  if ($[0] !== t0) {
    t1 = _jsx("div", {
      className: t0,
      role: "button",
      tabIndex: 0,
      children: _jsx(DragHandleIcon, {
        className: `${baseClass}__icon`
      })
    });
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
};
//# sourceMappingURL=index.js.map