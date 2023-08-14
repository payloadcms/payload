import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import * as Locales from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import CalendarIcon from '../../icons/Calendar';
import XIcon from '../../icons/X';
import { Props } from './types';
import { getSupportedDateLocale } from '../../../utilities/formatDate/getSupportedDateLocale';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

const baseClass = 'date-time-picker';

const DateTime: React.FC<Props> = (props) => {
  const {
    value,
    onChange,
    displayFormat: customDisplayFormat,
    pickerAppearance = 'default',
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

  // Use the user's AdminUI language preference for the locale
  const { i18n } = useTranslation();
  const locale = getSupportedDateLocale(i18n.language);

  try {
    registerLocale(locale, Locales[locale]);
  } catch (e) {
    console.warn(`Could not find DatePicker locale for ${locale}`);
  }

  let dateFormat = customDisplayFormat;

  if (!customDisplayFormat) {
    // when no displayFormat is provided, determine format based on the picker appearance
    if (pickerAppearance === 'default') dateFormat = 'MM/dd/yyyy';
    else if (pickerAppearance === 'dayAndTime') dateFormat = 'MMM d, yyy h:mm a';
    else if (pickerAppearance === 'timeOnly') dateFormat = 'h:mm a';
    else if (pickerAppearance === 'dayOnly') dateFormat = 'MMM dd';
    else if (pickerAppearance === 'monthOnly') dateFormat = 'MMMM';
  }

  const dateTimePickerProps = {
    minDate,
    maxDate,
    dateFormat,
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
          locale={locale}
          popperModifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
            },
          ]}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
    </div>
  );
};

export default DateTime;
