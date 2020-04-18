import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';

import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import CalendarIcon from '../../../graphics/Calendar';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

const defaultError = 'Please fill in the field with a valid date';

const baseClass = 'date-time-picker';

const DateTime = (props) => {
  const {
    name,
    required,
    defaultValue,
    validate,
    style,
    width,
    errorMessage,
    label,
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
  } = props;

  const {
    value,
    showError,
    onFieldChange,
    formProcessing,
  } = useFieldType({
    name,
    required,
    defaultValue,
    validate,
  });

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
    onChange: val => onFieldChange(val),
    showPopperArrow: false,
    selected: value && new Date(value),
    customInputRef: 'ref',
  };

  const classes = [
    'field-type',
    baseClass,
    !useDate && `${baseClass}--hide-dates`,
    showError && `${baseClass}--has-error`,
    formProcessing && 'processing',
  ].filter(Boolean).join(' ');

  const fieldWidth = width ? `${width}%` : undefined;

  return (
    <div
      className={classes}
      style={{
        ...style,
        width: fieldWidth,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={name}
        label={label}
        required={required}
      />
      <div className={`${baseClass}__input-wrapper`}>
        <DatePicker {...dateTimePickerProps} />
        <CalendarIcon />
      </div>
    </div>
  );
};

DateTime.defaultProps = {
  label: null,
  required: false,
  defaultValue: null,
  placeholder: undefined,
  validate: null,
  errorMessage: defaultError,
  width: 100,
  style: {},
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
};

DateTime.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
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
};

export default withCondition(DateTime);
