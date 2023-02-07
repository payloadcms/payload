import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import * as Locales from 'date-fns/locale';
import { useLocale } from '../../utilities/Locale';
import CalendarIcon from '../../icons/Calendar';
import XIcon from '../../icons/X';
import { Props } from './types';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

const baseClass = 'date-time-picker';

const formattedLocales = {
  en: 'enUS',
  my: 'enUS', // Burmese is not currently supported
  ua: 'uk',
  zh: 'zhCN',
};

const DateTime: React.FC<Props> = (props) => {
  const {
    value,
    onChange,
    displayFormat,
    pickerAppearance = 'dayAndTime',
    minDate,
    maxDate,
    monthsToShow = 1,
    minTime,
    maxTime,
    timeIntervals = 30,
    timeFormat = 'h:mm aa',
    readOnly,
    placeholder: placeholderText,
  } = props;

  let currentLocale = useLocale();
  currentLocale = formattedLocales[currentLocale] || currentLocale;

  try {
    const locale = Locales[currentLocale];
    registerLocale(currentLocale, locale);
  } catch (e) {
    console.warn(`Could not find DatePicker locale for ${currentLocale}`);
  }

  let dateTimeFormat = displayFormat;

  if (dateTimeFormat === undefined) {
    if (pickerAppearance === 'dayAndTime') dateTimeFormat = 'MMM d, yyy h:mm a';
    else if (pickerAppearance === 'timeOnly') dateTimeFormat = 'h:mm a';
    else if (pickerAppearance === 'monthOnly') dateTimeFormat = 'MM/yyyy';
    else dateTimeFormat = 'MMM d, yyy';
  }

  const dateTimePickerProps = {
    minDate,
    maxDate,
    dateFormat: dateTimeFormat,
    monthsShown: Math.min(2, monthsToShow),
    showTimeSelect: pickerAppearance === 'dayAndTime' || pickerAppearance === 'timeOnly',
    minTime,
    maxTime,
    timeIntervals,
    timeFormat,
    placeholderText,
    disabled: readOnly,
    onChange,
    showPopperArrow: false,
    selected: value && new Date(value),
    customInputRef: 'ref',
    showMonthYearPicker: pickerAppearance === 'monthOnly',
  };

  const classes = [
    baseClass,
    `${baseClass}__appearance--${pickerAppearance}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={`${baseClass}__icon-wrap`}>
        {dateTimePickerProps.selected && (
          <button
            type="button"
            className={`${baseClass}__clear-button`}
            onClick={() => onChange(null)}
          >
            <XIcon />
          </button>
        )}
        <CalendarIcon />
      </div>
      <div className={`${baseClass}__input-wrapper`}>
        <DatePicker
          {...dateTimePickerProps}
          onChange={(val) => onChange(val as Date)}
          locale={currentLocale || 'en-US'}
          popperModifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default DateTime;
