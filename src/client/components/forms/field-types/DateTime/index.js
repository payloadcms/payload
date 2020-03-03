import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';

import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

const defaultError = 'Please fill in the field as a valid date';
const defaultValidate = value => value instanceof Date;

const defaultDatePickerProps = {
  showTimeSelect: false,
  dateFormat: 'MMM d, yyy h:mm aa',
  timeIntervals: 15,
  timeCaption: 'Time',
  timeFormat: 'h:mm',
  minDate: new Date(),
};

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
    placeholder,
    reactDatepickerProps,
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

  const datePickerProps = {
    ...defaultDatePickerProps,
    ...reactDatepickerProps,
    showPopperArrow: false,
    placeholderText: placeholder,
    selected: value && new Date(value),
    onChange: val => onFieldChange(val),
  };

  const classes = [
    'field-type',
    'date-time-picker',
    showError && 'date-time-picker--has-error',
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
      <DatePicker {...datePickerProps} />
    </div>
  );
};

DateTime.defaultProps = {
  label: null,
  required: false,
  defaultValue: null,
  placeholder: undefined,
  validate: defaultValidate,
  errorMessage: defaultError,
  width: 100,
  style: {},
  reactDatepickerProps: {},
};

DateTime.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
  reactDatepickerProps: PropTypes.shape({}),
};

export default DateTime;
