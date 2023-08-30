import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Props } from './types.js';

import { email } from '../../../../../fields/validations.js';
import { getTranslation } from '../../../../../utilities/getTranslation.js';
import Error from '../../Error/index.js';
import FieldDescription from '../../FieldDescription/index.js';
import Label from '../../Label/index.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import './index.scss';

const Email: React.FC<Props> = (props) => {
  const {
    admin: {
      autoComplete,
      className,
      condition,
      description,
      placeholder,
      readOnly,
      style,
      width,
    } = {},
    label,
    name,
    path: pathFromProps,
    required,
    validate = email,
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const fieldType = useField({
    condition,
    path,
    validate: memoizedValidate,
  });

  const {
    errorMessage,
    setValue,
    showError,
    value,
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
        disabled={Boolean(readOnly)}
        id={`field-${path.replace(/\./g, '__')}`}
        name={path}
        onChange={setValue}
        placeholder={getTranslation(placeholder, i18n)}
        type="email"
        value={value as string || ''}
      />
      <FieldDescription
        description={description}
        value={value}
      />
    </div>
  );
};

export default withCondition(Email);
