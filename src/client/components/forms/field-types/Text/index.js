import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import { text } from '../../../../../fields/validations';

import './index.scss';

const Text = (props) => {
  const {
    path,
    required,
    defaultValue,
    validate,
    style,
    width,
    label,
    placeholder,
  } = props;

  const {
    value,
    showError,
    onFieldChange,
    formProcessing,
    errorMessage,
  } = useFieldType({
    path,
    required,
    defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    'text',
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
        onChange={onFieldChange}
        disabled={formProcessing ? 'disabled' : undefined}
        placeholder={placeholder}
        type="text"
        id={path}
        name={path}
      />
    </div>
  );
};

Text.defaultProps = {
  label: null,
  required: false,
  defaultValue: null,
  placeholder: undefined,
  width: undefined,
  style: {},
  validate: text,
};

Text.propTypes = {
  path: PropTypes.string.isRequired,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
};

export default withCondition(Text);
