'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import './index.scss';
import { useTranslation } from '../../providers/Translation/index.js';
import { ReactSelect } from '../ReactSelect/index.js';
import { formatOptions } from '../WhereBuilder/Condition/Select/formatOptions.js';
export const TimezonePicker = props => {
  const {
    id,
    onChange: onChangeFromProps,
    options: optionsFromProps,
    readOnly: readOnlyFromProps,
    required,
    selectedTimezone: selectedTimezoneFromProps
  } = props;
  const {
    t
  } = useTranslation();
  const options = formatOptions(optionsFromProps);
  const selectedTimezone = useMemo(() => {
    return options.find(t_0 => {
      const value = typeof t_0 === 'string' ? t_0 : t_0.value;
      return value === (selectedTimezoneFromProps || 'UTC');
    });
  }, [options, selectedTimezoneFromProps]);
  const readOnly = Boolean(readOnlyFromProps) || options.length === 1;
  return /*#__PURE__*/_jsxs("div", {
    className: "timezone-picker-wrapper",
    children: [/*#__PURE__*/_jsx(FieldLabel, {
      htmlFor: id,
      label: `${t('general:timezone')} ${required ? '*' : ''}`,
      required: required,
      unstyled: true
    }), /*#__PURE__*/_jsx(ReactSelect, {
      className: "timezone-picker",
      disabled: readOnly,
      inputId: id,
      isClearable: !required,
      isCreatable: false,
      onChange: val => {
        if (onChangeFromProps) {
          onChangeFromProps(val?.value || '');
        }
      },
      options: options,
      value: selectedTimezone
    })]
  });
};
//# sourceMappingURL=index.js.map