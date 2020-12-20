import React, { useCallback } from 'react';
import useFieldType from '../../useFieldType';
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
        disabled={processing}
        type="password"
        autoComplete={autoComplete}
        id={path}
        name={path}
      />
    </div>
  );
};

export default withCondition(Password);
