'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
export const PasswordInput = props => {
  const $ = _c(28);
  const {
    AfterInput,
    autoComplete: t0,
    BeforeInput,
    className,
    description,
    Description,
    Error,
    inputRef,
    Label,
    label,
    localized,
    onChange,
    onKeyDown,
    path,
    placeholder,
    readOnly,
    required,
    rtl,
    showError,
    style,
    value,
    width
  } = props;
  const autoComplete = t0 === undefined ? "off" : t0;
  const {
    i18n
  } = useTranslation();
  const t1 = showError && "error";
  const t2 = readOnly && "read-only";
  let t3;
  if ($[0] !== className || $[1] !== t1 || $[2] !== t2) {
    t3 = [fieldBaseClass, "password", className, t1, t2].filter(Boolean);
    $[0] = className;
    $[1] = t1;
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const t4 = t3.join(" ");
  let t5;
  if ($[4] !== AfterInput || $[5] !== BeforeInput || $[6] !== Description || $[7] !== Error || $[8] !== Label || $[9] !== autoComplete || $[10] !== description || $[11] !== i18n || $[12] !== inputRef || $[13] !== label || $[14] !== localized || $[15] !== onChange || $[16] !== onKeyDown || $[17] !== path || $[18] !== placeholder || $[19] !== readOnly || $[20] !== required || $[21] !== rtl || $[22] !== showError || $[23] !== style || $[24] !== t4 || $[25] !== value || $[26] !== width) {
    t5 = _jsxs("div", {
      className: t4,
      style: {
        ...style,
        width
      },
      children: [_jsx(RenderCustomComponent, {
        CustomComponent: Label,
        Fallback: _jsx(FieldLabel, {
          label,
          localized,
          path,
          required
        })
      }), _jsxs("div", {
        className: `${fieldBaseClass}__wrap`,
        children: [_jsx(RenderCustomComponent, {
          CustomComponent: Error,
          Fallback: _jsx(FieldError, {
            path,
            showError
          })
        }), _jsxs("div", {
          children: [BeforeInput, _jsx("input", {
            "aria-label": getTranslation(label, i18n),
            autoComplete,
            "data-rtl": rtl,
            disabled: readOnly,
            id: `field-${path.replace(/\./g, "__")}`,
            name: path,
            onChange,
            onKeyDown,
            placeholder: getTranslation(placeholder, i18n),
            ref: inputRef,
            type: "password",
            value: value || ""
          }), AfterInput]
        }), _jsx(RenderCustomComponent, {
          CustomComponent: Description,
          Fallback: _jsx(FieldDescription, {
            description,
            path
          })
        })]
      })]
    });
    $[4] = AfterInput;
    $[5] = BeforeInput;
    $[6] = Description;
    $[7] = Error;
    $[8] = Label;
    $[9] = autoComplete;
    $[10] = description;
    $[11] = i18n;
    $[12] = inputRef;
    $[13] = label;
    $[14] = localized;
    $[15] = onChange;
    $[16] = onKeyDown;
    $[17] = path;
    $[18] = placeholder;
    $[19] = readOnly;
    $[20] = required;
    $[21] = rtl;
    $[22] = showError;
    $[23] = style;
    $[24] = t4;
    $[25] = value;
    $[26] = width;
    $[27] = t5;
  } else {
    t5 = $[27];
  }
  return t5;
};
//# sourceMappingURL=input.js.map