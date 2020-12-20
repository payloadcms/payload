import React, { useCallback } from 'react';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { email } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

const Email: React.FC<Omit<Props, 'type'>> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = email,
    admin: {
      readOnly,
      style,
      width,
      placeholder,
      autoComplete,
    } = {},
    label,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const fieldType = useFieldType({
    path,
    validate: memoizedValidate,
    enableDebouncedValue: true,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const classes = [
    'field-type',
    'email',
    showError && 'error',
    readOnly && 'read-only',
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
        disabled={Boolean(readOnly)}
        placeholder={placeholder}
        type="email"
        id={path}
        name={path}
        autoComplete={autoComplete}
      />
    </div>
  );
};

export default withCondition(Email);
