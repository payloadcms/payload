import React, { useCallback } from 'react';

import type { Props } from './types.js';

import { password } from '../../../../../fields/validations.js';
import Error from '../../Error/index.js';
import Label from '../../Label/index.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import './index.scss';

const Password: React.FC<Props> = (props) => {
  const {
    autoComplete,
    className,
    disabled,
    label,
    name,
    path: pathFromProps,
    required,
    style,
    validate = password,
    width,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    const validationResult = validate(value, { ...options, required });
    return validationResult;
  }, [validate, required]);

  const {
    errorMessage,
    formProcessing,
    setValue,
    showError,
    value,
  } = useField({
    path,
    validate: memoizedValidate,
  });

  const classes = [
    'field-type',
    'password',
    className,
    showError && 'error',
  ].filter(Boolean).join(' ');

  return (
    <div
      style={{
        ...style,
        width,
      }}
      className={classes}
    >
      <Error
        message={errorMessage}
        showError={showError}
      />
      <Label
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
      />
      <input
        autoComplete={autoComplete}
        disabled={formProcessing || disabled}
        id={`field-${path.replace(/\./g, '__')}`}
        name={path}
        onChange={setValue}
        type="password"
        value={value as string || ''}
      />
    </div>
  );
};

export default withCondition(Password);
