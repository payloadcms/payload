import React from 'react';
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
  } = props;

  const path = pathFromProps || name;

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
    validate,
  });

  const classes = [
    'field-type',
    'textarea',
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
      <textarea
        value={value || ''}
        onChange={setValue}
        disabled={formProcessing ? 'disabled' : undefined}
        placeholder={placeholder}
        id={path}
        name={path}
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
};

export default withCondition(Textarea);
