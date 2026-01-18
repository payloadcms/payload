'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useField } from '../../../forms/useField/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'section-title';
/**
 * An input field representing the block's `blockName` property - responsible for reading and saving the `blockName`
 * property from/into the provided path.
 */
export const SectionTitle = props => {
  const $ = _c(14);
  const {
    customOnChange,
    customValue,
    path,
    readOnly
  } = props;
  let t0;
  if ($[0] !== path) {
    t0 = {
      path
    };
    $[0] = path;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const {
    setValue,
    value
  } = useField(t0);
  const {
    t
  } = useTranslation();
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [baseClass].filter(Boolean);
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const classes = t1.join(" ");
  let t2;
  if ($[3] !== customOnChange || $[4] !== setValue) {
    t2 = customOnChange || (e => {
      e.stopPropagation();
      e.preventDefault();
      setValue(e.target.value);
    });
    $[3] = customOnChange;
    $[4] = setValue;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const onChange = t2;
  const t3 = customValue || value;
  let t4;
  if ($[6] !== customValue || $[7] !== onChange || $[8] !== path || $[9] !== readOnly || $[10] !== t || $[11] !== t3 || $[12] !== value) {
    t4 = _jsx("div", {
      className: classes,
      "data-value": t3,
      children: _jsx("input", {
        className: `${baseClass}__input`,
        id: path,
        name: path,
        onChange,
        placeholder: t("general:untitled"),
        readOnly,
        type: "text",
        value: customValue || value || ""
      })
    });
    $[6] = customValue;
    $[7] = onChange;
    $[8] = path;
    $[9] = readOnly;
    $[10] = t;
    $[11] = t3;
    $[12] = value;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  return t4;
};
//# sourceMappingURL=index.js.map