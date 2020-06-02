import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';

import './index.scss';

const NumberField = (props) => {
  const {
    name,
    required,
    defaultValue,
    validate,
    style,
    width,
    label,
    placeholder,
    max,
    min,
  } = props;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { min, max });
    return validationResult;
  }, [validate, max, min]);

  const {
    value,
    showError,
    onFieldChange,
    formProcessing,
    errorMessage,
  } = useFieldType({
    name,
    required,
    defaultValue,
    validate: memoizedValidate,
  });


  const classes = [
    'field-type',
    'number',
    showError && 'error',
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
        htmlFor={name}
        label={label}
        required={required}
      />
      <input
        value={value || ''}
        onChange={e => onFieldChange(parseInt(e.target.value, 10))}
        disabled={formProcessing ? 'disabled' : undefined}
        placeholder={placeholder}
        type="number"
        id={name}
        name={name}
      />
    </div>
  );
};

NumberField.defaultProps = {
  label: null,
  required: false,
  defaultValue: null,
  placeholder: undefined,
  width: undefined,
  style: {},
  max: undefined,
  min: undefined,
};

NumberField.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.number,
  validate: PropTypes.func.isRequired,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
};

export default withCondition(NumberField);
