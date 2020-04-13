import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';

import './index.scss';

const defaultError = 'Please fill in the field';
const defaultValidate = value => (/^-?[0-9]\d*$/).test(value);

const NumberField = (props) => {
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
    'text',
    showError && 'error',
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
      <input
        value={value || ''}
        onChange={e => onFieldChange(parseInt(e.target.value, 10))}
        disabled={formProcessing ? 'disabled' : undefined}
        placeholder={placeholder}
        type="number"
        id={name}
        name={name}
      />
    </div>
  );
};

NumberField.defaultProps = {
  label: null,
  required: false,
  defaultValue: null,
  placeholder: undefined,
  validate: defaultValidate,
  errorMessage: defaultError,
  width: 100,
  style: {},
};

NumberField.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.number,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
  label: PropTypes.string,
};

export default withCondition(NumberField);
