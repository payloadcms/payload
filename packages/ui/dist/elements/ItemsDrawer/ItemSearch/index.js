'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId } from 'react';
import { SearchIcon } from '../../../icons/Search/index.js';
import './index.scss';
const baseClass = 'item-search';
export const ItemSearch = t0 => {
  const $ = _c(7);
  const {
    placeholder,
    setSearchTerm
  } = t0;
  const inputId = useId();
  const labelId = `${inputId}-label`;
  let t1;
  if ($[0] !== setSearchTerm) {
    t1 = e => {
      setSearchTerm(e.target.value);
    };
    $[0] = setSearchTerm;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleChange = t1;
  let t2;
  if ($[2] !== handleChange || $[3] !== inputId || $[4] !== labelId || $[5] !== placeholder) {
    t2 = _jsxs("div", {
      className: baseClass,
      children: [_jsx("label", {
        className: "sr-only",
        htmlFor: inputId,
        id: labelId,
        children: placeholder
      }), _jsx("input", {
        "aria-labelledby": labelId,
        className: `${baseClass}__input`,
        id: inputId,
        onChange: handleChange,
        placeholder,
        type: "text"
      }), _jsx(SearchIcon, {})]
    });
    $[2] = handleChange;
    $[3] = inputId;
    $[4] = labelId;
    $[5] = placeholder;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
};
//# sourceMappingURL=index.js.map