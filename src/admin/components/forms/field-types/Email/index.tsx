import React, { useCallback } from 'react';
import withCondition from '../../withCondition';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { email } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

const Email: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = email,
    admin: {
      readOnly,
      style,
      className,
      width,
      placeholder,
      autoComplete,
      description,
      condition,
    } = {},
    label,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const fieldType = useField({
    path,
    validate: memoizedValidate,
    enableDebouncedValue: true,
    condition,
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
    className,
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
        value={value as string || ''}
        onChange={setValue}
        disabled={Boolean(readOnly)}
        placeholder={placeholder}
        type="email"
        id={path}
        name={path}
        autoComplete={autoComplete}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(Email);
