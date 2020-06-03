import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';
import { password } from '../../../../../fields/validations';

import './index.scss';

const Password = (props) => {
  const {
    path,
    required,
    defaultValue,
    validate,
    style,
    width,
    label,
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
    'password',
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
        type="password"
        autoComplete="current-password"
        id={path}
        name={path}
      />
    </div>
  );
};

Password.defaultProps = {
  required: false,
  defaultValue: null,
  validate: password,
  width: undefined,
  style: {},
};

Password.propTypes = {
  path: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string.isRequired,
  validate: PropTypes.func,
};

export default withCondition(Password);
