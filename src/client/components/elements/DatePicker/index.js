import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import CalendarIcon from '../../icons/Calendar';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

const baseClass = 'date-time-picker';

const DateTime = (props) => {
  const {
    inputDateTimeFormat,
    useDate,
    minDate,
    maxDate,
    monthsShown,
    useTime,
    minTime,
    maxTime,
    timeIntervals,
    timeFormat,
    placeholder: placeholderText,
    value,
    onChange,
  } = props;

  let dateTimeFormat = inputDateTimeFormat;

  if (!dateTimeFormat) {
    if (useTime && useDate) dateTimeFormat = 'MMM d, yyy h:mma';
    else if (useTime) dateTimeFormat = 'h:mma';
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
    onChange,
    showPopperArrow: false,
    selected: value && new Date(value),
    customInputRef: 'ref',
  };

  const classes = [
    baseClass,
    !useDate && `${baseClass}--hide-dates`,
  ].filter(Boolean).join(' ');

  console.log(value);

  return (
    <div className={classes}>
      <div className={`${baseClass}__input-wrapper`}>
        <DatePicker {...dateTimePickerProps} />
        <CalendarIcon />
      </div>
    </div>
  );
};

DateTime.defaultProps = {
  placeholder: undefined,
  // date specific props
  useDate: true,
  minDate: new Date(),
  maxDate: null,
  monthsShown: 1,
  inputDateTimeFormat: '',
  // time specific props
  useTime: false,
  minTime: new Date('4040-01-01T01:00:00'),
  maxTime: new Date('4040-01-01T24:00:00'),
  timeIntervals: 30,
  timeFormat: 'h:mm aa',
  value: undefined,
};

DateTime.propTypes = {
  placeholder: PropTypes.string,
  // date specific props
  useDate: PropTypes.bool,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  monthsShown: PropTypes.number,
  inputDateTimeFormat: PropTypes.string,
  // time specific props
  useTime: PropTypes.bool,
  minTime: PropTypes.instanceOf(Date),
  maxTime: PropTypes.instanceOf(Date),
  timeIntervals: PropTypes.number,
  timeFormat: PropTypes.string,
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
};

export default DateTime;
