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
    validate,
    admin: {
      readOnly,
      style,
      width,
    } = {},
    label,
    placeholder,
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
  validate: textarea,
  placeholder: null,
  path: '',
  admin: {},
  minLength: undefined,
  maxLength: undefined,
  rows: 8,
};

Textarea.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  validate: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  rows: PropTypes.number,
};

export default withCondition(Textarea);
