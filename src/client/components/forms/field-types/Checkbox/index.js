import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import StyledCheckbox from './StyledCheckbox';

import './index.scss';

const defaultError = 'Checkbox is required';
const defaultValidate = value => Boolean(value);

const Checkbox = (props) => {
  const {
    name,
    required,
    defaultValue,
    validate,
    style,
    width,
    errorMessage,
    label,
  } = props;

  const {
    value,
    showError,
    onFieldChange,
    formProcessing,
  } = useFieldType({
    name,
    required,
    defaultValue,
    validate,
  });

  const checkboxRef = useRef(null);

  const classes = [
    'field-type',
    'checkbox',
    value && 'checkbox--is-checked',
    showError && 'error',
  ].filter(Boolean).join(' ');

  const fieldWidth = width ? `${width}%` : undefined;

  const formatFieldChangeValue = () => onFieldChange(checkboxRef.current.checked);

  return (
    <div
      className={classes}
      style={{
        ...style,
        width: fieldWidth,
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
        className="checkbox__input"
        ref={checkboxRef}
        value={value}
        onChange={formatFieldChangeValue}
        disabled={formProcessing ? 'disabled' : undefined}
        type="checkbox"
        id={name}
        name={name}
        checked={value}
      />
      <StyledCheckbox
        onClick={onFieldChange}
        isChecked={value}
      />
    </div>
  );
};

Checkbox.defaultProps = {
  label: null,
  required: false,
  defaultValue: false,
  validate: defaultValidate,
  errorMessage: defaultError,
  width: 100,
  style: {},
};

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.bool,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
  label: PropTypes.string,
};

export default Checkbox;
