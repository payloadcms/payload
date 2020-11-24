import React from 'react';
import DatePicker from 'react-datepicker';
import CalendarIcon from '../../icons/Calendar';
import { Props } from './types';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

const baseClass = 'date-time-picker';

const DateTime: React.FC<Props> = (props) => {
  const {
    inputDateTimeFormat,
    useDate = true,
    minDate,
    maxDate,
    monthsShown = 1,
    useTime = true,
    minTime,
    maxTime,
    timeIntervals = 30,
    timeFormat = 'h:mm aa',
    placeholder: placeholderText,
    value,
    onChange,
    admin: {
      readOnly,
    } = {},
  } = props;

  let dateTimeFormat = inputDateTimeFormat;

  if (!dateTimeFormat) {
    if (useTime && useDate) dateTimeFormat = 'MMM d, yyy h:mm a';
    else if (useTime) dateTimeFormat = 'h:mm a';
    else dateTimeFormat = 'MMM d, yyy';
  }

  const dateTimePickerProps = {
    minDate,
    maxDate,
    dateFormat: dateTimeFormat,
    monthsShown: Math.min(2, monthsShown),
    showTimeSelect: useTime,
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
  };

  const classes = [
    baseClass,
    !useDate && `${baseClass}--hide-dates`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={`${baseClass}__input-wrapper`}>
        <DatePicker {...dateTimePickerProps} />
        <CalendarIcon />
      </div>
    </div>
  );
};

export default DateTime;
