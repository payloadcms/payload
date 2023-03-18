import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import * as Locales from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { getMonth, getYear } from 'date-fns';
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
    displayFormat,
    pickerAppearance,
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

  let dateTimeFormat = displayFormat;

  if (dateTimeFormat === undefined && pickerAppearance) {
    if (pickerAppearance === 'dayAndTime') dateTimeFormat = 'MMM d, yyy h:mm a';
    else if (pickerAppearance === 'timeOnly') dateTimeFormat = 'h:mm a';
    else if (pickerAppearance === 'dayOnly') dateTimeFormat = 'dd';
    else if (pickerAppearance === 'monthOnly') dateTimeFormat = 'MMMM';
    else dateTimeFormat = 'MMM d, yyy';
  }

  const years = Array.from({ length: getYear(new Date()) - 1990 + 1 }, (_, i) => i + 1990);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

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
    renderCustomHeader: ({
      date,
      changeYear,
      changeMonth,
      decreaseMonth,
      increaseMonth,
      prevMonthButtonDisabled,
      nextMonthButtonDisabled,
    }) => (
      <div
        className="react-datepicker__current-month"
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >

        <button
          type="button"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          aria-label="Previous Month"
          className="react-datepicker__navigation react-datepicker__navigation--previous"
        >
          <span
            className="react-datepicker__navigation-icon react-datepicker__navigation-icon--previous"
          >
            Previous Month
          </span>
        </button>
        <div
          style={{
            display: 'flex',
            gap: 4,
          }}
        >
          {pickerAppearance !== 'monthOnly' && (
            <select
              value={months[getMonth(date)]}
              onChange={({ target }) => changeMonth(months.indexOf(target.value))}
            >
              {months.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          )}

          <select
            value={getYear(date)}
            onChange={({ target }) => changeYear(target.value)}
          >
            {years.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          aria-label="Previous Month"
          className="react-datepicker__navigation react-datepicker__navigation--next"
        >
          <span
            className="react-datepicker__navigation-icon react-datepicker__navigation-icon--next"
          >
            Next Month
          </span>
        </button>

      </div>
    ),
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
        />
      </div>
    </div>
  );
};

export default DateTime;
