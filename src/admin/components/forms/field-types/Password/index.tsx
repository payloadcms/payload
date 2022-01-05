import React, { useCallback } from 'react';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';
import { password } from '../../../../../fields/validations';
import { Props } from './types';

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
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
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
    enableDebouncedValue: true,
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
        htmlFor={path}
        label={label}
        required={required}
      />
      <input
        value={value as string || ''}
        onChange={setValue}
        disabled={formProcessing}
        type="password"
        autoComplete={autoComplete}
        id={path}
        name={path}
      />
    </div>
  );
};

export default withCondition(Password);
