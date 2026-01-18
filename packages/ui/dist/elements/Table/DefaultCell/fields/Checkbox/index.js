'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from '../../../../../providers/Translation/index.js';
import './index.scss';
export const CheckboxCell = t0 => {
  const $ = _c(3);
  const {
    cellData
  } = t0;
  const {
    t
  } = useTranslation();
  const t1 = `general:${cellData}`;
  let t2;
  if ($[0] !== t || $[1] !== t1) {
    t2 = _jsx("code", {
      className: "bool-cell",
      children: _jsx("span", {
        children: t(t1).toLowerCase()
      })
    });
    $[0] = t;
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
};
//# sourceMappingURL=index.js.map