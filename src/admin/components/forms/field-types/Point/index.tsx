import React, { useCallback } from 'react';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import withCondition from '../../withCondition';
import { point } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

const PointField: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = point,
    label,
    admin: {
      readOnly,
      style,
      width,
      step,
      placeholder,
      description,
      condition,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value = [null, null],
    showError,
    setValue,
    errorMessage,
  } = useFieldType<[number, number]>({
    path,
    validate: memoizedValidate,
    enableDebouncedValue: true,
    condition,
  });

  const handleChange = useCallback((e, index: 0 | 1) => {
    let val = parseFloat(e.target.value);
    if (Number.isNaN(val)) {
      val = e.target.value;
    }
    const coordinates = [...value];
    coordinates[index] = val;
    setValue(coordinates);
  }, [setValue, value]);

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
        value={(value && typeof value[0] === 'number') ? value[0] : ''}
        onChange={(e) => handleChange(e, 0)}
        disabled={readOnly}
        placeholder={placeholder}
        type="number"
        id={path}
        name={path}
        step={step}
      />
      ,
      <input
        value={(value && typeof value[1] === 'number') ? value[1] : ''}
        onChange={(e) => handleChange(e, 1)}
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

export default withCondition(PointField);
