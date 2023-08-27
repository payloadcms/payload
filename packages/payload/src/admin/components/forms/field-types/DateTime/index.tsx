import React, { useCallback } from 'react';

import { useTranslation } from 'react-i18next';
import DatePicker from '../../../elements/DatePicker.js';
import withCondition from '../../withCondition.js';
import useField from '../../useField.js';
import Label from '../../Label.js';
import Error from '../../Error.js';
import FieldDescription from '../../FieldDescription.js';
import { date as dateValidation } from '../../../../../fields/validations.js';
import { Props } from './types.js';
import { getTranslation } from '../../../../../utilities/getTranslation.js';

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
