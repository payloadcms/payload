import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { textarea } from '../../../../../fields/validations';
import { Props } from './types';
import TextareaInput from './Input';
import { getTranslation } from '../../../../../utilities/getTranslation';

import './index.scss';

const Textarea: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = textarea,
    maxLength,
    minLength,
    admin: {
      readOnly,
      style,
      className,
      width,
      placeholder,
      rows,
      description,
      condition,
    } = {},
    label,
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required, maxLength, minLength });
  }, [validate, required, maxLength, minLength]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
    path,
    validate: memoizedValidate,
    condition,
  });

  return (
    <TextareaInput
      path={path}
      name={name}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      showError={showError}
      errorMessage={errorMessage}
      required={required}
      label={label}
      value={value as string}
      placeholder={getTranslation(placeholder, i18n)}
      readOnly={readOnly}
      style={style}
      className={className}
      width={width}
      description={description}
      rows={rows}
    />
  );
};
export default withCondition(Textarea);
