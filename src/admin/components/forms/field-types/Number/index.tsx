import React, { useCallback } from 'react';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import withCondition from '../../withCondition';
import { number } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

const NumberField: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = number,
    label,
    max,
    min,
    admin: {
      readOnly,
      style,
      width,
      step,
      placeholder,
      description,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { min, max, required });
    return validationResult;
  }, [validate, max, min, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    enableDebouncedValue: true,
  });

  const handleChange = useCallback((e) => {
    const val = parseFloat(e.target.value);

    if (Number.isNaN(val)) {
      setValue('');
    } else {
      setValue(val);
    }
  }, [setValue]);

  const classes = [
    'field-type',
    'number',
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
      <input
        value={typeof value === 'number' ? value : ''}
        onChange={handleChange}
        disabled={readOnly}
        placeholder={placeholder}
        type="number"
        id={path}
        name={path}
        step={step}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(NumberField);
