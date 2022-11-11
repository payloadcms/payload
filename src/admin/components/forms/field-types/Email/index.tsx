import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import withCondition from '../../withCondition';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { email } from '../../../../../fields/validations';
import { Props } from './types';
import { getTranslation } from '../../../../../utilities/getTranslation';

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
