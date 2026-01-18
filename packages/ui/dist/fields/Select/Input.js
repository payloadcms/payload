'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { ReactSelect } from '../../elements/ReactSelect/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
export const SelectInput = props => {
  const $ = _c(37);
  const {
    id,
    AfterInput,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    filterOption,
    hasMany: t0,
    isClearable: t1,
    isSortable: t2,
    label,
    Label,
    localized,
    onChange,
    onInputChange,
    options,
    path,
    placeholder,
    readOnly,
    required,
    showError,
    style,
    value
  } = props;
  const hasMany = t0 === undefined ? false : t0;
  const isClearable = t1 === undefined ? true : t1;
  const isSortable = t2 === undefined ? true : t2;
  const {
    i18n
  } = useTranslation();
  let t3;
  if ($[0] !== AfterInput || $[1] !== BeforeInput || $[2] !== Description || $[3] !== Error || $[4] !== Label || $[5] !== className || $[6] !== description || $[7] !== filterOption || $[8] !== hasMany || $[9] !== i18n || $[10] !== id || $[11] !== isClearable || $[12] !== isSortable || $[13] !== label || $[14] !== localized || $[15] !== onChange || $[16] !== onInputChange || $[17] !== options || $[18] !== path || $[19] !== placeholder || $[20] !== readOnly || $[21] !== required || $[22] !== showError || $[23] !== style || $[24] !== value) {
    let valueToRender;
    if (hasMany && Array.isArray(value)) {
      let t4;
      if ($[26] !== i18n || $[27] !== options) {
        t4 = val => {
          const matchingOption = options.find(option => option.value === val);
          return {
            label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
            value: matchingOption?.value ?? val
          };
        };
        $[26] = i18n;
        $[27] = options;
        $[28] = t4;
      } else {
        t4 = $[28];
      }
      valueToRender = value.map(t4);
    } else {
      if (value) {
        let t4;
        if ($[29] !== value) {
          t4 = option_0 => option_0.value === value;
          $[29] = value;
          $[30] = t4;
        } else {
          t4 = $[30];
        }
        const matchingOption_0 = options.find(t4);
        valueToRender = {
          label: matchingOption_0 ? getTranslation(matchingOption_0.label, i18n) : value,
          value: matchingOption_0?.value ?? value
        };
      } else {
        valueToRender = null;
      }
    }
    const t4 = showError && "error";
    const t5 = readOnly && "read-only";
    let t6;
    if ($[31] !== className || $[32] !== t4 || $[33] !== t5) {
      t6 = [fieldBaseClass, "select", className, t4, t5].filter(Boolean);
      $[31] = className;
      $[32] = t4;
      $[33] = t5;
      $[34] = t6;
    } else {
      t6 = $[34];
    }
    let t7;
    if ($[35] !== i18n) {
      t7 = option_1 => ({
        ...option_1,
        label: getTranslation(option_1.label, i18n)
      });
      $[35] = i18n;
      $[36] = t7;
    } else {
      t7 = $[36];
    }
    t3 = _jsxs("div", {
      className: t6.join(" "),
      id: `field-${path.replace(/\./g, "__")}`,
      style,
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
        }), BeforeInput, _jsx(ReactSelect, {
          disabled: readOnly,
          filterOption,
          id,
          isClearable,
          isMulti: hasMany,
          isSortable,
          onChange,
          onInputChange,
          options: options.map(t7),
          placeholder,
          showError,
          value: valueToRender
        }), AfterInput]
      }), _jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: _jsx(FieldDescription, {
          description,
          path
        })
      })]
    });
    $[0] = AfterInput;
    $[1] = BeforeInput;
    $[2] = Description;
    $[3] = Error;
    $[4] = Label;
    $[5] = className;
    $[6] = description;
    $[7] = filterOption;
    $[8] = hasMany;
    $[9] = i18n;
    $[10] = id;
    $[11] = isClearable;
    $[12] = isSortable;
    $[13] = label;
    $[14] = localized;
    $[15] = onChange;
    $[16] = onInputChange;
    $[17] = options;
    $[18] = path;
    $[19] = placeholder;
    $[20] = readOnly;
    $[21] = required;
    $[22] = showError;
    $[23] = style;
    $[24] = value;
    $[25] = t3;
  } else {
    t3 = $[25];
  }
  return t3;
};
//# sourceMappingURL=Input.js.map