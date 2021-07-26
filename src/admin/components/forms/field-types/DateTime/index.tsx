import React, { useCallback } from 'react';

import DatePicker from '../../../elements/DatePicker';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { date as dateValidation } from '../../../../../fields/validations';
import { Props } from './types';

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
      width,
      date,
      condition,
      description,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    condition,
  });

  const classes = [
    'field-type',
    baseClass,
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
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <div className={`${baseClass}__input-wrapper`}>
        <DatePicker
          {...date}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={readOnly ? undefined : setValue}
          value={value as Date}
        />
      </div>
      <FieldDescription
        value={value || new Date()}
        description={description}
      />
    </div>
  );
};

export default withCondition(DateTime);
