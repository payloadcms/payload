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
    path: pathFromProps,
    required,
    defaultValue,
    initialData,
    validate,
    style,
    width,
    label,
    placeholder,
    max,
    min,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { min, max });
    return validationResult;
  }, [validate, max, min]);

  const {
    value,
    showError,
    setValue,
    formProcessing,
    errorMessage,
  } = useFieldType({
    path,
    required,
    initialData,
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
        htmlFor={path}
        label={label}
        required={required}
      />
      <input
        value={value || ''}
        onChange={e => setValue(parseInt(e.target.value, 10))}
        disabled={formProcessing ? 'disabled' : undefined}
        placeholder={placeholder}
        type="number"
        id={path}
        name={path}
      />
    </div>
  );
};

NumberField.defaultProps = {
  label: null,
  required: false,
  defaultValue: undefined,
  initialData: undefined,
  placeholder: undefined,
  width: undefined,
  style: {},
  max: undefined,
  min: undefined,
  path: '',
};

NumberField.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.number,
  initialData: PropTypes.number,
  validate: PropTypes.func.isRequired,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
};

export default withCondition(NumberField);
