import React, { useCallback } from 'react';

import DatePicker from '../../../elements/DatePicker';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { date } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

const baseClass = 'date-time-field';

const DateTime: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = date,
    label,
    admin: {
      readOnly,
      style,
      width,
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
          {...props}
          onChange={readOnly ? undefined : setValue}
          value={value as Date}
        />
      </div>
    </div>
  );
};

export default withCondition(DateTime);
