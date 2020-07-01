import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import { textarea } from '../../../../../fields/validations';

import './index.scss';

const Textarea = (props) => {
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
    rows,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { minLength, maxLength, required });
    return validationResult;
  }, [validate, maxLength, minLength, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useFieldType({
    path,
    required,
    initialData,
    defaultValue,
    validate: memoizedValidate,
    enableDebouncedValue: true,
  });

  const classes = [
    'field-type',
    'textarea',
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
      <textarea
        value={value || ''}
        onChange={setValue}
        disabled={readOnly ? 'disabled' : undefined}
        placeholder={placeholder}
        id={path}
        name={path}
        rows={rows}
      />
    </div>
  );
};

Textarea.defaultProps = {
  required: false,
  label: null,
  defaultValue: undefined,
  initialData: undefined,
  validate: textarea,
  width: undefined,
  style: {},
  placeholder: null,
  path: '',
  readOnly: false,
  minLength: undefined,
  maxLength: undefined,
  rows: 8,
};

Textarea.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  rows: PropTypes.number,
};

export default withCondition(Textarea);
