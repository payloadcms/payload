import React from 'react';
import PropTypes from 'prop-types';

import DatePicker from '../../../elements/DatePicker';
import withConditions from '../../withConditions';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const defaultError = 'Please fill in the field with a valid date';

const baseClass = 'date-time-field';

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

  const classes = [
    'field-type',
    baseClass,
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
        <DatePicker
          {...props}
          onChange={onFieldChange}
          value={value}
        />
      </div>
    </div>
  );
};

DateTime.defaultProps = {
  label: null,
  required: false,
  defaultValue: null,
  validate: null,
  errorMessage: defaultError,
  width: 100,
  style: {},
};

DateTime.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
};

export default withConditions(DateTime);
