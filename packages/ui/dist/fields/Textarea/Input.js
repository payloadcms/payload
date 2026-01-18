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
export const TextareaInput = props => {
  const $ = _c(26);
  const {
    AfterInput,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    Label,
    label,
    localized,
    onChange,
    path,
    placeholder,
    readOnly,
    required,
    rows,
    rtl,
    showError,
    style,
    value
  } = props;
  const {
    i18n
  } = useTranslation();
  const t0 = showError && "error";
  const t1 = readOnly && "read-only";
  let t2;
  if ($[0] !== className || $[1] !== t0 || $[2] !== t1) {
    t2 = [fieldBaseClass, "textarea", className, t0, t1].filter(Boolean);
    $[0] = className;
    $[1] = t0;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const t3 = t2.join(" ");
  const t4 = `field-${path.replace(/\./g, "__")}`;
  let t5;
  if ($[4] !== AfterInput || $[5] !== BeforeInput || $[6] !== Description || $[7] !== Error || $[8] !== Label || $[9] !== description || $[10] !== i18n || $[11] !== label || $[12] !== localized || $[13] !== onChange || $[14] !== path || $[15] !== placeholder || $[16] !== readOnly || $[17] !== required || $[18] !== rows || $[19] !== rtl || $[20] !== showError || $[21] !== style || $[22] !== t3 || $[23] !== t4 || $[24] !== value) {
    t5 = _jsxs("div", {
      className: t3,
      style,
      children: [_jsx(RenderCustomComponent, {
        CustomComponent: Label,
        Fallback: _jsx(FieldLabel, {
          htmlFor: t4,
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
        }), BeforeInput, _jsx("div", {
          className: "textarea-outer",
          children: _jsx("textarea", {
            "data-rtl": rtl,
            disabled: readOnly,
            id: `field-${path.replace(/\./g, "__")}`,
            name: path,
            onChange,
            placeholder: getTranslation(placeholder, i18n),
            rows,
            style: {
              "--rows": rows
            },
            value: value || ""
          })
        }), AfterInput, _jsx(RenderCustomComponent, {
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
    $[9] = description;
    $[10] = i18n;
    $[11] = label;
    $[12] = localized;
    $[13] = onChange;
    $[14] = path;
    $[15] = placeholder;
    $[16] = readOnly;
    $[17] = required;
    $[18] = rows;
    $[19] = rtl;
    $[20] = showError;
    $[21] = style;
    $[22] = t3;
    $[23] = t4;
    $[24] = value;
    $[25] = t5;
  } else {
    t5 = $[25];
  }
  return t5;
};
//# sourceMappingURL=Input.js.map