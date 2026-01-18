'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDatePickerDefaultImport, { registerLocale, setDefaultLocale } from 'react-datepicker';
const ReactDatePicker = 'default' in ReactDatePickerDefaultImport ? ReactDatePickerDefaultImport.default : ReactDatePickerDefaultImport;
import { CalendarIcon } from '../../icons/Calendar/index.js';
import { XIcon } from '../../icons/X/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './library.scss';
import './index.scss';
import { getFormattedLocale } from './getFormattedLocale.js';
const baseClass = 'date-time-picker';
const DatePicker = props => {
  const $ = _c(6);
  const {
    id,
    displayFormat: customDisplayFormat,
    maxDate,
    maxTime,
    minDate,
    minTime,
    monthsToShow: t0,
    onChange: onChangeFromProps,
    overrides,
    pickerAppearance: t1,
    placeholder: placeholderText,
    readOnly,
    timeFormat: t2,
    timeIntervals: t3,
    value
  } = props;
  const monthsToShow = t0 === undefined ? 1 : t0;
  const pickerAppearance = t1 === undefined ? "default" : t1;
  const timeFormat = t2 === undefined ? "h:mm aa" : t2;
  const timeIntervals = t3 === undefined ? 30 : t3;
  const {
    i18n
  } = useTranslation();
  let dateFormat = customDisplayFormat;
  if (!customDisplayFormat) {
    if (pickerAppearance === "default") {
      dateFormat = "MM/dd/yyyy";
    } else {
      if (pickerAppearance === "dayAndTime") {
        dateFormat = "MMM d, yyy h:mm a";
      } else {
        if (pickerAppearance === "timeOnly") {
          dateFormat = "h:mm a";
        } else {
          if (pickerAppearance === "dayOnly") {
            dateFormat = "MMM dd";
          } else {
            if (pickerAppearance === "monthOnly") {
              dateFormat = "MMMM";
            }
          }
        }
      }
    }
  }
  const onChange = incomingDate => {
    const newDate = incomingDate;
    if (newDate instanceof Date && ["dayOnly", "default", "monthOnly"].includes(pickerAppearance)) {
      const tzOffset = incomingDate.getTimezoneOffset() / 60;
      newDate.setHours(12 - tzOffset, 0);
    }
    if (newDate instanceof Date && !dateFormat.includes("SSS")) {
      newDate.setMilliseconds(0);
    }
    if (typeof onChangeFromProps === "function") {
      onChangeFromProps(newDate);
    }
  };
  const dateTimePickerProps = {
    customInputRef: "ref",
    dateFormat,
    disabled: readOnly,
    maxDate,
    maxTime,
    minDate,
    minTime,
    monthsShown: Math.min(2, monthsToShow),
    onChange,
    placeholderText,
    popperPlacement: "bottom-start",
    selected: value && new Date(value),
    showMonthYearPicker: pickerAppearance === "monthOnly",
    showPopperArrow: false,
    showTimeSelect: pickerAppearance === "dayAndTime" || pickerAppearance === "timeOnly",
    timeFormat,
    timeIntervals,
    ...overrides
  };
  const t4 = `${baseClass}__appearance--${pickerAppearance}`;
  let t5;
  if ($[0] !== t4) {
    t5 = [baseClass, t4].filter(Boolean);
    $[0] = t4;
    $[1] = t5;
  } else {
    t5 = $[1];
  }
  const classes = t5.join(" ");
  let t6;
  let t7;
  if ($[2] !== i18n.dateFNS || $[3] !== i18n.language) {
    t6 = () => {
      if (i18n.dateFNS) {
        ;
        try {
          const datepickerLocale = getFormattedLocale(i18n.language);
          registerLocale(datepickerLocale, i18n.dateFNS);
          setDefaultLocale(datepickerLocale);
        } catch (t8) {
          console.warn(`Could not find DatePicker locale for ${i18n.language}`);
        }
      }
    };
    t7 = [i18n.language, i18n.dateFNS];
    $[2] = i18n.dateFNS;
    $[3] = i18n.language;
    $[4] = t6;
    $[5] = t7;
  } else {
    t6 = $[4];
    t7 = $[5];
  }
  React.useEffect(t6, t7);
  return _jsxs("div", {
    className: classes,
    id,
    children: [_jsxs("div", {
      className: `${baseClass}__icon-wrap`,
      children: [dateTimePickerProps.selected && _jsx("button", {
        className: `${baseClass}__clear-button`,
        onClick: () => onChange(null),
        type: "button",
        children: _jsx(XIcon, {})
      }), _jsx(CalendarIcon, {})]
    }), _jsx("div", {
      className: `${baseClass}__input-wrapper`,
      children: _jsx(ReactDatePicker, {
        ...dateTimePickerProps,
        dropdownMode: "select",
        showMonthDropdown: true,
        showYearDropdown: true
      })
    })]
  });
};
// eslint-disable-next-line no-restricted-exports
export default DatePicker;
//# sourceMappingURL=DatePicker.js.map