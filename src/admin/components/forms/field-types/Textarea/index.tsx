import React, { useCallback } from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { textarea } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

const Textarea: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = textarea,
    admin: {
      readOnly,
      style,
      width,
      placeholder,
      rows,
      description,
      condition,
    } = {},
    label,
    minLength,
    maxLength,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { minLength, maxLength, required });
    return validationResult;
  }, [validate, maxLength, minLength, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
    path,
    validate: memoizedValidate,
    enableDebouncedValue: true,
    condition,
  });

  const classes = [
    'field-type',
    'textarea',
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
      <textarea
        value={value as string || ''}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        disabled={readOnly}
        placeholder={placeholder}
        id={path}
        name={path}
        rows={rows}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};
export default withCondition(Textarea);
