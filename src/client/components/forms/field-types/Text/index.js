import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import { text } from '../../../../../validation/validations';

import './index.scss';

const Text = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    defaultValue,
    initialData,
    validate,
    style,
    width,
    label,
    placeholder,
    readOnly,
    minLength,
    maxLength,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { minLength, maxLength, required });
    return validationResult;
  }, [validate, maxLength, minLength, required]);

  const fieldType = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
    validate: memoizedValidate,
    enableDebouncedValue: true,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const classes = [
    'field-type',
    'text',
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
        value={value || ''}
        onChange={setValue}
        disabled={readOnly ? 'disabled' : undefined}
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
  readOnly: false,
  defaultValue: undefined,
  initialData: undefined,
  placeholder: undefined,
  width: undefined,
  style: {},
  validate: text,
  path: '',
  minLength: undefined,
  maxLength: undefined,
};

Text.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
  ]),
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
};

export default withCondition(Text);
