'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useEditDepth } from '../../../providers/EditDepth/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'radio-input';
export const Radio = props => {
  const $ = _c(16);
  const {
    isSelected,
    onChange,
    option,
    path,
    readOnly,
    uuid
  } = props;
  const {
    i18n
  } = useTranslation();
  const editDepth = useEditDepth();
  const id = `field-${path}-${option.value}${editDepth > 1 ? `-${editDepth}` : ""}${uuid ? `-${uuid}` : ""}`;
  const t0 = isSelected && `${baseClass}--is-selected`;
  let t1;
  if ($[0] !== t0) {
    t1 = [baseClass, t0].filter(Boolean);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = t1.join(" ");
  let t3;
  if ($[2] !== onChange || $[3] !== option.value) {
    t3 = () => typeof onChange === "function" ? onChange(option.value) : null;
    $[2] = onChange;
    $[3] = option.value;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  let t4;
  if ($[5] !== i18n || $[6] !== id || $[7] !== isSelected || $[8] !== option.label || $[9] !== path || $[10] !== readOnly || $[11] !== t2 || $[12] !== t3) {
    const t5 = _jsx("input", {
      checked: isSelected,
      disabled: readOnly,
      id,
      name: path,
      onChange: t3,
      type: "radio"
    });
    const t6 = readOnly && `${baseClass}__styled-radio--disabled`;
    let t7;
    if ($[14] !== t6) {
      t7 = [`${baseClass}__styled-radio`, t6].filter(Boolean);
      $[14] = t6;
      $[15] = t7;
    } else {
      t7 = $[15];
    }
    t4 = _jsx("label", {
      htmlFor: id,
      children: _jsxs("div", {
        className: t2,
        children: [t5, _jsx("span", {
          className: t7.join(" ")
        }), _jsx("span", {
          className: `${baseClass}__label`,
          children: getTranslation(option.label, i18n)
        })]
      })
    });
    $[5] = i18n;
    $[6] = id;
    $[7] = isSelected;
    $[8] = option.label;
    $[9] = path;
    $[10] = readOnly;
    $[11] = t2;
    $[12] = t3;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  return t4;
};
//# sourceMappingURL=index.js.map