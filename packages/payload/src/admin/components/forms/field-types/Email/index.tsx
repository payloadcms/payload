import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import withCondition from '../../withCondition.js';
import useField from '../../useField.js';
import Label from '../../Label.js';
import Error from '../../Error.js';
import FieldDescription from '../../FieldDescription.js';
import { email } from '../../../../../fields/validations.js';
import { Props } from './types.js';
import { getTranslation } from '../../../../../utilities/getTranslation.js';

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

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const fieldType = useField({
    path,
    validate: memoizedValidate,
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
        htmlFor={`field-${path.replace(/\./gi, '__')}`}
        label={label}
        required={required}
      />
      <input
        id={`field-${path.replace(/\./gi, '__')}`}
        value={value as string || ''}
        onChange={setValue}
        disabled={Boolean(readOnly)}
        placeholder={getTranslation(placeholder, i18n)}
        type="email"
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
