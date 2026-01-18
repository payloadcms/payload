'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { ReactSelect } from '../../../ReactSelect/index.js';
import './index.scss';
const baseClass = 'condition-value-number';
export const NumberFilter = props => {
  const $ = _c(20);
  const {
    disabled,
    field: t0,
    onChange,
    operator,
    value
  } = props;
  const {
    admin,
    hasMany
  } = t0;
  const {
    i18n,
    t
  } = useTranslation();
  let t1;
  if ($[0] !== hasMany || $[1] !== operator) {
    t1 = ["in", "not_in"].includes(operator) || hasMany;
    $[0] = hasMany;
    $[1] = operator;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const isMulti = t1;
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const [valueToRender, setValueToRender] = React.useState(t2);
  let t3;
  if ($[4] !== isMulti || $[5] !== onChange) {
    t3 = selectedOption => {
      let newValue;
      if (!selectedOption) {
        newValue = [];
      } else {
        if (isMulti) {
          if (Array.isArray(selectedOption)) {
            newValue = selectedOption.map(_temp);
          } else {
            newValue = [Number(selectedOption.value?.value || selectedOption.value)];
          }
        }
      }
      onChange(newValue);
    };
    $[4] = isMulti;
    $[5] = onChange;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const onSelect = t3;
  let t4;
  let t5;
  if ($[7] !== value) {
    t4 = () => {
      if (Array.isArray(value)) {
        setValueToRender(value.map(_temp2));
      } else {
        setValueToRender([]);
      }
    };
    t5 = [value];
    $[7] = value;
    $[8] = t4;
    $[9] = t5;
  } else {
    t4 = $[8];
    t5 = $[9];
  }
  React.useEffect(t4, t5);
  let t6;
  if ($[10] !== admin?.placeholder || $[11] !== disabled || $[12] !== i18n || $[13] !== isMulti || $[14] !== onChange || $[15] !== onSelect || $[16] !== t || $[17] !== value || $[18] !== valueToRender) {
    const placeholder = getTranslation(admin?.placeholder, i18n) || t("general:enterAValue");
    t6 = isMulti ? _jsx(ReactSelect, {
      disabled,
      isClearable: true,
      isCreatable: true,
      isMulti,
      isSortable: true,
      numberOnly: true,
      onChange: onSelect,
      options: [],
      placeholder,
      value: valueToRender || []
    }) : _jsx("input", {
      className: baseClass,
      disabled,
      onChange: e => onChange(e.target.value),
      placeholder,
      type: "number",
      value
    });
    $[10] = admin?.placeholder;
    $[11] = disabled;
    $[12] = i18n;
    $[13] = isMulti;
    $[14] = onChange;
    $[15] = onSelect;
    $[16] = t;
    $[17] = value;
    $[18] = valueToRender;
    $[19] = t6;
  } else {
    t6 = $[19];
  }
  return t6;
};
function _temp(option) {
  return Number(option.value?.value || option.value);
}
function _temp2(val, index) {
  return {
    id: `${val}${index}`,
    label: `${val}`,
    value: {
      toString: () => `${val}${index}`,
      value: val?.value || val
    }
  };
}
//# sourceMappingURL=index.js.map