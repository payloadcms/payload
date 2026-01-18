'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useForm } from '../../forms/Form/context.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { filterOutUploadFields } from '../../utilities/filterOutUploadFields.js';
import { ReactSelect } from '../ReactSelect/index.js';
import { reduceFieldOptions } from './reduceFieldOptions.js';
import './index.scss';
const baseClass = 'field-select';
export const FieldSelect = t0 => {
  const $ = _c(14);
  const {
    fields,
    onChange,
    permissions
  } = t0;
  const {
    t
  } = useTranslation();
  const {
    dispatchFields,
    getFields
  } = useForm();
  let t1;
  if ($[0] !== fields || $[1] !== getFields || $[2] !== permissions) {
    t1 = () => reduceFieldOptions({
      fields: filterOutUploadFields(fields),
      formState: getFields(),
      permissions
    });
    $[0] = fields;
    $[1] = getFields;
    $[2] = permissions;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const [options] = useState(t1);
  let t2;
  if ($[4] !== dispatchFields || $[5] !== getFields || $[6] !== onChange || $[7] !== options || $[8] !== t) {
    let t3;
    if ($[10] !== dispatchFields || $[11] !== getFields || $[12] !== onChange) {
      t3 = selected => onChange({
        dispatchFields,
        formState: getFields(),
        selected
      });
      $[10] = dispatchFields;
      $[11] = getFields;
      $[12] = onChange;
      $[13] = t3;
    } else {
      t3 = $[13];
    }
    t2 = _jsxs("div", {
      className: baseClass,
      children: [_jsx(FieldLabel, {
        label: t("fields:selectFieldsToEdit")
      }), _jsx(ReactSelect, {
        getOptionValue: _temp,
        isMulti: true,
        onChange: t3,
        options
      })]
    });
    $[4] = dispatchFields;
    $[5] = getFields;
    $[6] = onChange;
    $[7] = options;
    $[8] = t;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  return t2;
};
function _temp(option) {
  if (typeof option.value === "object" && "path" in option.value) {
    return String(option.value.path);
  }
  return String(option.value);
}
//# sourceMappingURL=index.js.map