'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { ReactSelect } from '../../../ReactSelect/index.js';
import { formatOptions } from './formatOptions.js';
export const Select = t0 => {
  const $ = _c(21);
  const {
    disabled,
    field: t1,
    isClearable,
    onChange,
    operator,
    options: optionsFromProps,
    value
  } = t0;
  const {
    admin: t2
  } = t1;
  const {
    placeholder
  } = t2;
  const {
    i18n
  } = useTranslation();
  let t3;
  if ($[0] !== optionsFromProps) {
    t3 = formatOptions(optionsFromProps);
    $[0] = optionsFromProps;
    $[1] = t3;
  } else {
    t3 = $[1];
  }
  const [options, setOptions] = React.useState(t3);
  let t4;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = ["in", "not_in"];
    $[2] = t4;
  } else {
    t4 = $[2];
  }
  const isMulti = t4.includes(operator);
  let valueToRender;
  if (isMulti && Array.isArray(value)) {
    let t5;
    if ($[3] !== i18n || $[4] !== options) {
      t5 = val => {
        const matchingOption = options.find(option => option.value === val);
        return {
          label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
          value: matchingOption?.value ?? val
        };
      };
      $[3] = i18n;
      $[4] = options;
      $[5] = t5;
    } else {
      t5 = $[5];
    }
    valueToRender = value.map(t5);
  } else {
    if (value) {
      let t5;
      if ($[6] !== value) {
        t5 = option_0 => option_0.value === value;
        $[6] = value;
        $[7] = t5;
      } else {
        t5 = $[7];
      }
      const matchingOption_0 = options.find(t5);
      valueToRender = {
        label: matchingOption_0 ? getTranslation(matchingOption_0.label, i18n) : value,
        value: matchingOption_0?.value ?? value
      };
    }
  }
  let t5;
  if ($[8] !== isMulti || $[9] !== onChange) {
    t5 = selectedOption => {
      let newValue;
      if (!selectedOption) {
        newValue = null;
      } else {
        if (isMulti) {
          if (Array.isArray(selectedOption)) {
            newValue = selectedOption.map(_temp);
          } else {
            newValue = [];
          }
        } else {
          newValue = selectedOption.value;
        }
      }
      onChange(newValue);
    };
    $[8] = isMulti;
    $[9] = onChange;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  const onSelect = t5;
  let t6;
  let t7;
  if ($[11] !== optionsFromProps) {
    t6 = () => {
      setOptions(formatOptions(optionsFromProps));
    };
    t7 = [optionsFromProps];
    $[11] = optionsFromProps;
    $[12] = t6;
    $[13] = t7;
  } else {
    t6 = $[12];
    t7 = $[13];
  }
  React.useEffect(t6, t7);
  let t8;
  let t9;
  if ($[14] !== isMulti || $[15] !== onChange || $[16] !== value) {
    t8 = () => {
      if (!isMulti && Array.isArray(value)) {
        onChange(value[0]);
      }
    };
    t9 = [isMulti, onChange, value];
    $[14] = isMulti;
    $[15] = onChange;
    $[16] = value;
    $[17] = t8;
    $[18] = t9;
  } else {
    t8 = $[17];
    t9 = $[18];
  }
  React.useEffect(t8, t9);
  let t10;
  if ($[19] !== i18n) {
    t10 = option_2 => ({
      ...option_2,
      label: getTranslation(option_2.label, i18n)
    });
    $[19] = i18n;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  return _jsx(ReactSelect, {
    disabled,
    isClearable,
    isMulti,
    onChange: onSelect,
    options: options.map(t10),
    placeholder,
    value: valueToRender
  });
};
function _temp(option_1) {
  return option_1.value;
}
//# sourceMappingURL=index.js.map