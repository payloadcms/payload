import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';
import { password } from '../../../../../fields/validations';

import './index.scss';

const Password = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate,
    style,
    width,
    autoComplete,
    label,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
    processing,
    setValue,
    errorMessage,
  } = useFieldType({
    path,
    required,
    validate: memoizedValidate,
    enableDebouncedValue: true,
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
        onChange={setValue}
        disabled={processing ? 'disabled' : undefined}
        type="password"
        autoComplete={autoComplete}
        id={path}
        name={path}
      />
    </div>
  );
};

Password.defaultProps = {
  required: false,
  validate: password,
  width: undefined,
  style: {},
  path: '',
  autoComplete: 'off',
};

Password.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string.isRequired,
  validate: PropTypes.func,
  autoComplete: PropTypes.string,
};

export default withCondition(Password);
