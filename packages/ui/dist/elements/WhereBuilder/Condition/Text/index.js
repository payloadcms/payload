'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { ReactSelect } from '../../../ReactSelect/index.js';
import './index.scss';
const baseClass = 'condition-value-text';
export const Text = props => {
  const $ = _c(18);
  const {
    disabled,
    field: t0,
    onChange,
    operator,
    value
  } = props;
  const {
    hasMany
  } = t0;
  const {
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
            newValue = [selectedOption.value?.value || selectedOption.value];
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
  if ($[10] !== disabled || $[11] !== isMulti || $[12] !== onChange || $[13] !== onSelect || $[14] !== t || $[15] !== value || $[16] !== valueToRender) {
    t6 = isMulti ? _jsx(ReactSelect, {
      disabled,
      isClearable: true,
      isCreatable: true,
      isMulti,
      isSortable: true,
      onChange: onSelect,
      options: [],
      placeholder: t("general:enterAValue"),
      value: valueToRender || []
    }) : _jsx("input", {
      className: baseClass,
      disabled,
      onChange: e => onChange(e.target.value),
      placeholder: t("general:enterAValue"),
      type: "text",
      value: value || ""
    });
    $[10] = disabled;
    $[11] = isMulti;
    $[12] = onChange;
    $[13] = onSelect;
    $[14] = t;
    $[15] = value;
    $[16] = valueToRender;
    $[17] = t6;
  } else {
    t6 = $[17];
  }
  return t6;
};
function _temp(option) {
  return option.value?.value || option.value;
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