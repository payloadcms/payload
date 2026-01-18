'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { confirmPassword } from 'payload/shared';
import React from 'react';
import { useField } from '../../forms/useField/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { FieldError } from '../FieldError/index.js';
import { FieldLabel } from '../FieldLabel/index.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
export const ConfirmPasswordField = props => {
  const $ = _c(12);
  const {
    disabled: disabledFromProps,
    path: t0
  } = props;
  const path = t0 === undefined ? "confirm-password" : t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== path) {
    t1 = {
      path,
      validate: _temp
    };
    $[0] = path;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const {
    disabled,
    setValue,
    showError,
    value: value_0
  } = useField(t1);
  const t2 = showError && "error";
  let t3;
  if ($[2] !== t2) {
    t3 = [fieldBaseClass, "confirm-password", t2].filter(Boolean);
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  const t4 = t3.join(" ");
  let t5;
  if ($[4] !== disabled || $[5] !== disabledFromProps || $[6] !== path || $[7] !== setValue || $[8] !== t || $[9] !== t4 || $[10] !== value_0) {
    t5 = _jsxs("div", {
      className: t4,
      children: [_jsx(FieldLabel, {
        htmlFor: "field-confirm-password",
        label: t("authentication:confirmPassword"),
        required: true
      }), _jsxs("div", {
        className: `${fieldBaseClass}__wrap`,
        children: [_jsx(FieldError, {
          path
        }), _jsx("input", {
          "aria-label": t("authentication:confirmPassword"),
          autoComplete: "off",
          disabled: !!(disabled || disabledFromProps),
          id: "field-confirm-password",
          name: "confirm-password",
          onChange: setValue,
          type: "password",
          value: value_0 || ""
        })]
      })]
    });
    $[4] = disabled;
    $[5] = disabledFromProps;
    $[6] = path;
    $[7] = setValue;
    $[8] = t;
    $[9] = t4;
    $[10] = value_0;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  return t5;
};
function _temp(value, options) {
  return confirmPassword(value, {
    name: "confirm-password",
    type: "text",
    required: true,
    ...options
  });
}
//# sourceMappingURL=index.js.map