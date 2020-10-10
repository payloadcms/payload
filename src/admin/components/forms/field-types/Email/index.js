import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { email } from '../../../../../fields/validations';

import './index.scss';

const Email = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate,
    admin: {
      readOnly,
      style,
      width,
    } = {},
    label,
    placeholder,
    autoComplete,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const fieldType = useFieldType({
    path,
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
    'email',
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
        type="email"
        id={path}
        name={path}
        autoComplete={autoComplete}
      />
    </div>
  );
};

Email.defaultProps = {
  label: null,
  required: false,
  placeholder: undefined,
  admin: {},
  autoComplete: undefined,
  validate: email,
  path: '',
};

Email.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  validate: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
  label: PropTypes.string,
  autoComplete: PropTypes.string,
};

export default withCondition(Email);
