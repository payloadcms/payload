import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Props } from './types';

import { date as dateValidation } from '../../../../../fields/validations';
import { getTranslation } from '../../../../../utilities/getTranslation';
import DatePicker from '../../../elements/DatePicker';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import Label from '../../Label';
import useField from '../../useField';
import withCondition from '../../withCondition';
import './index.scss';

const baseClass = 'date-time-field';

const DateTime: React.FC<Props> = (props) => {
  const {
    admin: {
      className,
      condition,
      date,
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
    validate = dateValidation,
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const {
    errorMessage,
    setValue,
    showError,
    value,
  } = useField({
    condition,
    path,
    validate: memoizedValidate,
  });

  const classes = [
    'field-type',
    baseClass,
    className,
    showError && `${baseClass}--has-error`,
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
      <div className={`${baseClass}__error-wrap`}>
        <Error
          message={errorMessage}
          showError={showError}
        />
      </div>
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <div
        className={`${baseClass}__input-wrapper`}
        id={`field-${path.replace(/\./g, '__')}`}
      >
        <DatePicker
          {...date}
          onChange={(incomingDate) => {
            if (!readOnly) setValue(incomingDate?.toISOString() || null);
          }}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={readOnly}
          value={value as Date}
        />
      </div>
      <FieldDescription
        description={description}
        value={value}
      />
    </div>
  );
};

export default withCondition(DateTime);
