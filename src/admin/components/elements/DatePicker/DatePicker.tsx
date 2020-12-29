import React from 'react';
import DatePicker from 'react-datepicker';
import CalendarIcon from '../../icons/Calendar';
import { Props } from './types';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

const baseClass = 'date-time-picker';

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

  let dateTimeFormat = displayFormat;

  if (dateTimeFormat === undefined) {
    if (pickerAppearance === 'dayAndTime') dateTimeFormat = 'MMM d, yyy h:mm a';
    else if (pickerAppearance === 'timeOnly') dateTimeFormat = 'h:mm a';
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
  };

  const classes = [
    baseClass,
    `${baseClass}__appearance--${pickerAppearance}`,
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
