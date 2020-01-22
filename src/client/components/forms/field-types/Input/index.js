import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const defaultError = 'Please fill in the field';
const defaultValidate = value => value.length > 0;

const Input = (props) => {
  const {
    name,
    required,
    defaultValue,
    valueOverride,
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
    onChange,
    formProcessing,
  } = useFieldType({
    name,
    required,
    defaultValue,
    valueOverride,
    validate,
  });

  const classes = [
    'field-type',
    'input',
    showError && 'error',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={{
      ...style,
      width: width ? `${width}%` : null
    }}>
      <Error showError={showError} message={errorMessage} />
      <Label htmlFor={name} label={label} required={required} />
      <input
        value={value || ''}
        onChange={onChange}
        disabled={formProcessing ? 'disabled' : undefined}
        placeholder={placeholder}
        type="text"
        id={name}
        name={name} />
    </div>
  );
}

Input.defaultProps = {
  label: null,
  required: false,
  processing: false,
  defaultValue: null,
  validate: defaultValidate,
  errorMessage: defaultError,
  width: 100,
  style: {},
}

Input.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  defaultValidate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
  processing: PropTypes.bool,
  label: PropTypes.string,
}

export default Input;
