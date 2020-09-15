import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import CalendarIcon from '../../icons/Calendar';

import './react-datepicker.css';
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
    admin: {
      readOnly,
    } = {},
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

DateTime.defaultProps = {
  placeholder: undefined,
  // date specific props
  useDate: true,
  minDate: undefined,
  maxDate: undefined,
  monthsShown: 1,
  inputDateTimeFormat: '',
  // time specific props
  useTime: true,
  minTime: undefined,
  maxTime: undefined,
  timeIntervals: 30,
  timeFormat: 'h:mm aa',
  value: undefined,
  onChange: undefined,
  admin: {},
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
  onChange: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
  }),
};

export default DateTime;
