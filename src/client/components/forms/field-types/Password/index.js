import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';

import './index.scss';

const defaultError = 'Please enter a password.';
const defaultValidate = value => value.length > 3;

const Password = (props) => {
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
    processing,
    onFieldChange,
  } = useFieldType({
    name,
    required,
    defaultValue,
    validate,
  });

  const fieldWidth = width ? `${width}%` : null;

  return (
    <div
      className="field-type password"
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
        onChange={onFieldChange}
        disabled={processing ? 'disabled' : undefined}
        type="password"
        autoComplete="current-password"
        id={name}
        name={name}
      />
    </div>
  );
};

Password.defaultProps = {
  required: false,
  defaultValue: null,
  validate: defaultValidate,
  errorMessage: defaultError,
  width: 100,
  style: {},
};

Password.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
  label: PropTypes.string.isRequired,
  validate: PropTypes.func,
};

export default withCondition(Password);
