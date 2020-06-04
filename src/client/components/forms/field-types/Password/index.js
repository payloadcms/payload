import React from 'react';
import PropTypes from 'prop-types';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import withCondition from '../../withCondition';
import { password } from '../../../../../fields/validations';

import './index.scss';

const Password = (props) => {
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
  } = props;

  const path = pathFromProps || name;

  const {
    value,
    showError,
    processing,
    setValue,
    errorMessage,
  } = useFieldType({
    path,
    required,
    initialData: initialData || defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    'password',
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
        onChange={setValue}
        disabled={processing ? 'disabled' : undefined}
        type="password"
        autoComplete="current-password"
        id={path}
        name={path}
      />
    </div>
  );
};

Password.defaultProps = {
  required: false,
  initialData: undefined,
  defaultValue: undefined,
  validate: password,
  width: undefined,
  style: {},
  path: '',
};

Password.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  initialData: PropTypes.string,
  defaultValue: PropTypes.string,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string.isRequired,
  validate: PropTypes.func,
};

export default withCondition(Password);
