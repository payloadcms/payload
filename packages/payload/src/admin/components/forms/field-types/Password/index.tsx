import React, { useCallback } from 'react';
import useField from '../../useField/index.js';
import Label from '../../Label/index.js';
import Error from '../../Error/index.js';
import withCondition from '../../withCondition/index.js';
import { password } from '../../../../../fields/validations.js';
import { Props } from './types.js';

import './index.scss';

const Password: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = password,
    style,
    className,
    width,
    autoComplete,
    label,
    disabled,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    const validationResult = validate(value, { ...options, required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
    formProcessing,
    setValue,
    errorMessage,
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
        htmlFor={`field-${path.replace(/\./gi, '__')}`}
        label={label}
        required={required}
      />
      <input
        id={`field-${path.replace(/\./gi, '__')}`}
        value={value as string || ''}
        onChange={setValue}
        disabled={formProcessing || disabled}
        type="password"
        autoComplete={autoComplete}
        name={path}
      />
    </div>
  );
};

export default withCondition(Password);
