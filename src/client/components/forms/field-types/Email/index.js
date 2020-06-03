import React from 'react';
import PropTypes from 'prop-types';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { email } from '../../../../../fields/validations';

import './index.scss';

const Email = (props) => {
  const {
    path,
    required,
    defaultValue,
    validate,
    style,
    width,
    label,
    placeholder,
    autoComplete,
  } = props;

  const {
    value,
    showError,
    processing,
    onFieldChange,
    errorMessage,
  } = useFieldType({
    path,
    required,
    defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    'email',
    showError && 'error',
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
      <input
        value={value || ''}
        onChange={onFieldChange}
        disabled={processing ? 'disabled' : undefined}
        placeholder={placeholder}
        type="email"
        id={path}
        name={path}
        autoComplete={autoComplete}
      />
    </div>
  );
};

Email.defaultProps = {
  label: null,
  required: false,
  defaultValue: null,
  placeholder: undefined,
  width: undefined,
  style: {},
  autoComplete: undefined,
  validate: email,
};

Email.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
  autoComplete: PropTypes.string,
};

export default withCondition(Email);
