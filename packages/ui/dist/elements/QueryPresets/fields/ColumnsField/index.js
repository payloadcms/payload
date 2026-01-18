'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toWords, transformColumnsToSearchParams } from 'payload/shared';
import React from 'react';
import { FieldLabel } from '../../../../fields/FieldLabel/index.js';
import { useField } from '../../../../forms/useField/index.js';
import { Pill } from '../../../Pill/index.js';
import './index.scss';
export const QueryPresetsColumnField = t0 => {
  const $ = _c(5);
  const {
    field: t1
  } = t0;
  const {
    label,
    required
  } = t1;
  const {
    path,
    value
  } = useField();
  let t2;
  if ($[0] !== label || $[1] !== path || $[2] !== required || $[3] !== value) {
    t2 = _jsxs("div", {
      className: "field-type query-preset-columns-field",
      children: [_jsx(FieldLabel, {
        as: "h3",
        label,
        path,
        required
      }), _jsx("div", {
        className: "value-wrapper",
        children: value ? transformColumnsToSearchParams(value).map(_temp) : "No columns selected"
      })]
    });
    $[0] = label;
    $[1] = path;
    $[2] = required;
    $[3] = value;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
};
function _temp(column, i) {
  const isColumnActive = !column.startsWith("-");
  return _jsx(Pill, {
    pillStyle: isColumnActive ? "always-white" : "light-gray",
    size: "small",
    children: toWords(column)
  }, i);
}
//# sourceMappingURL=index.js.map