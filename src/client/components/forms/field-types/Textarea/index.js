import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const defaultError = 'Please fill in the field';
const defaultValidate = value => value.length > 0;

const Textarea = (props) => {
  const {
    name,
    required,
    defaultValue,
    validate,
    style,
    width,
    errorMessage,
    label,
    placeholder,
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

  const classes = [
    'field-type',
    'textarea',
    showError && 'error',
  ].filter(Boolean).join(' ');

  const fieldWidth = width ? `${width}%` : undefined;

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
      <textarea
        value={value || ''}
        onChange={onFieldChange}
        disabled={formProcessing ? 'disabled' : undefined}
        placeholder={placeholder}
        id={name}
        name={name}
      />
    </div>
  );
};

Textarea.defaultProps = {
  required: false,
  label: null,
  defaultValue: null,
  validate: defaultValidate,
  errorMessage: defaultError,
  width: 100,
  style: {},
};

Textarea.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  width: PropTypes.number,
  style: PropTypes.shape({}),
  label: PropTypes.string,
};

export default Textarea;
