'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { SearchIcon } from '../../../../icons/Search/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'block-search';
export const BlockSearch = props => {
  const $ = _c(5);
  const {
    setSearchTerm
  } = props;
  const {
    t
  } = useTranslation();
  let t0;
  if ($[0] !== setSearchTerm) {
    t0 = e => {
      setSearchTerm(e.target.value);
    };
    $[0] = setSearchTerm;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const handleChange = t0;
  let t1;
  if ($[2] !== handleChange || $[3] !== t) {
    t1 = _jsxs("div", {
      className: baseClass,
      children: [_jsx("input", {
        className: `${baseClass}__input`,
        onChange: handleChange,
        placeholder: t("fields:searchForBlock")
      }), _jsx(SearchIcon, {})]
    });
    $[2] = handleChange;
    $[3] = t;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
};
//# sourceMappingURL=index.js.map