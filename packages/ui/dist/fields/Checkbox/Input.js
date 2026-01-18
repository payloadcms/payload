'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId } from 'react';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { CheckIcon } from '../../icons/Check/index.js';
import { LineIcon } from '../../icons/Line/index.js';
export const inputBaseClass = 'checkbox-input';
export const CheckboxInput = t0 => {
  const $ = _c(22);
  const {
    id: idFromProps,
    name,
    AfterInput,
    BeforeInput,
    checked,
    className,
    inputRef,
    Label,
    label,
    localized,
    onToggle,
    partialChecked,
    readOnly,
    required
  } = t0;
  const fallbackID = useId();
  const id = idFromProps || fallbackID;
  const t1 = checked && `${inputBaseClass}--checked`;
  const t2 = readOnly && `${inputBaseClass}--read-only`;
  let t3;
  if ($[0] !== className || $[1] !== t1 || $[2] !== t2) {
    t3 = [className, inputBaseClass, t1, t2].filter(Boolean);
    $[0] = className;
    $[1] = t1;
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const t4 = t3.join(" ");
  const t5 = Boolean(checked);
  let t6;
  if ($[4] !== AfterInput || $[5] !== BeforeInput || $[6] !== Label || $[7] !== checked || $[8] !== id || $[9] !== inputRef || $[10] !== label || $[11] !== localized || $[12] !== name || $[13] !== onToggle || $[14] !== partialChecked || $[15] !== readOnly || $[16] !== required || $[17] !== t4 || $[18] !== t5) {
    const t7 = _jsx("input", {
      "aria-label": "",
      "aria-labelledby": name,
      defaultChecked: t5,
      disabled: readOnly,
      id,
      name,
      onInput: onToggle,
      ref: inputRef,
      required,
      title: name,
      type: "checkbox"
    });
    const t8 = !checked && partialChecked ? "partial" : "check";
    let t9;
    if ($[20] !== t8) {
      t9 = [`${inputBaseClass}__icon`, t8].filter(Boolean);
      $[20] = t8;
      $[21] = t9;
    } else {
      t9 = $[21];
    }
    t6 = _jsxs("div", {
      className: t4,
      children: [_jsxs("div", {
        className: `${inputBaseClass}__input`,
        children: [BeforeInput, t7, _jsxs("span", {
          className: t9.join(" "),
          children: [checked && _jsx(CheckIcon, {}), !checked && partialChecked && _jsx(LineIcon, {})]
        }), AfterInput]
      }), _jsx(RenderCustomComponent, {
        CustomComponent: Label,
        Fallback: _jsx(FieldLabel, {
          htmlFor: id,
          label,
          localized,
          required
        })
      })]
    });
    $[4] = AfterInput;
    $[5] = BeforeInput;
    $[6] = Label;
    $[7] = checked;
    $[8] = id;
    $[9] = inputRef;
    $[10] = label;
    $[11] = localized;
    $[12] = name;
    $[13] = onToggle;
    $[14] = partialChecked;
    $[15] = readOnly;
    $[16] = required;
    $[17] = t4;
    $[18] = t5;
    $[19] = t6;
  } else {
    t6 = $[19];
  }
  return t6;
};
//# sourceMappingURL=Input.js.map