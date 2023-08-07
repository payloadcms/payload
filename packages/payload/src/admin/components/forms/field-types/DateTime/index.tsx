import React, { useCallback } from 'react';

import { useTranslation } from 'react-i18next';
import DatePicker from '../../../elements/DatePicker';
import withCondition from '../../withCondition';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { date as dateValidation } from '../../../../../fields/validations';
import { Props } from './types';
import { getTranslation } from '../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'date-time-field';

const DateTime: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = dateValidation,
    label,
    admin: {
      placeholder,
      readOnly,
      style,
      className,
      width,
      date,
      description,
      condition,
    } = {},
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useField({
    path,
    validate: memoizedValidate,
    condition,
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
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
      </div>
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <div
        id={`field-${path.replace(/\./gi, '__')}`}
        className={`${baseClass}__input-wrapper`}
      >
        <DatePicker
          {...date}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={readOnly}
          onChange={(incomingDate) => {
            if (!readOnly) setValue(incomingDate?.toISOString() || null);
          }}
          value={value as Date}
        />
      </div>
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(DateTime);
