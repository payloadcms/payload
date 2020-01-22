import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const defaultError = 'Please enter a valid email.';
const defaultValidate = value => /\S+@\S+\.\S+/.test(value);

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
    processing,
  } = useFieldType({
    name,
    required,
    defaultValue,
    valueOverride,
    validate,
  });

  return (
    <div className="field-type email" style={{
      ...style,
      width: width ? `${width}%` : null
    }}>
      <Error showError={showError} message={errorMessage} />
      <Label htmlFor={name} label={label} required={required} />
      <input
        value={value || ''}
        onChange={onChange}
        disabled={processing ? 'disabled' : undefined}
        placeholder={placeholder}
        type="email"
        id={name}
        name={name} />
    </div>
  );
}

Input.defaultProps = {
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
  label: PropTypes.string.isRequired,
}

export default Input;
