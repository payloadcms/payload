import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';
import { number } from '../../../../../fields/validations';

import './index.scss';

const NumberField = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate,
    label,
    placeholder,
    max,
    min,
    admin: {
      readOnly,
      style,
      width,
      step,
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
    let val = parseFloat(e.target.value);
    if (Number.isNaN(val)) val = '';
    setValue(val);
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
        disabled={readOnly ? 'disabled' : undefined}
        placeholder={placeholder}
        type="number"
        id={path}
        name={path}
        step={step}
      />
    </div>
  );
};

NumberField.defaultProps = {
  label: null,
  path: undefined,
  required: false,
  placeholder: undefined,
  max: undefined,
  min: undefined,
  validate: number,
  admin: {},
};

NumberField.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  validate: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
    step: PropTypes.number,
  }),
  label: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
};

export default withCondition(NumberField);
