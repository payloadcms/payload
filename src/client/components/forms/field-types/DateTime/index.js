import React from 'react';
import PropTypes from 'prop-types';

import DatePicker from '../../../elements/DatePicker';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { date } from '../../../../../fields/validations';

import './index.scss';

const defaultError = 'Please fill in the field with a valid date';

const baseClass = 'date-time-field';

const DateTime = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    defaultValue,
    initialData,
    validate,
    style,
    width,
    errorMessage,
    label,
  } = props;

  const path = pathFromProps || name;

  const {
    value,
    showError,
    onFieldChange,
    formProcessing,
  } = useFieldType({
    path,
    required,
    initialData: initialData || defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    baseClass,
    showError && `${baseClass}--has-error`,
    formProcessing && 'processing',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={path}
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
  defaultValue: undefined,
  initialData: undefined,
  validate: date,
  errorMessage: defaultError,
  width: undefined,
  style: {},
  path: '',
};

DateTime.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.string,
  style: PropTypes.shape({}),
};

export default withCondition(DateTime);
