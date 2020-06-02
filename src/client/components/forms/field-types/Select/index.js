import React from 'react';
import PropTypes from 'prop-types';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const defaultError = 'Please make a selection.';
const defaultValidate = value => value.length > 0;

const formatFormValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((subValue) => {
      if (typeof subValue === 'object' && subValue.value) {
        return subValue.value;
      }

      return subValue;
    });
  }

  if (typeof value === 'object' && value !== null && value.value) {
    return value.value;
  }

  return value;
};

const formatRenderValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((subValue) => {
      if (typeof subValue === 'string') {
        return {
          label: subValue,
          value: subValue,
        };
      }

      return subValue;
    });
  }

  if (typeof value === 'string') {
    return {
      label: value,
      value,
    };
  }

  return value;
};

const Select = (props) => {
  const {
    name,
    required,
    defaultValue,
    validate,
    style,
    width,
    errorMessage,
    label,
    options,
    hasMany,
  } = props;

  const {
    value,
    showError,
    formProcessing,
    onFieldChange,
  } = useFieldType({
    name,
    required,
    defaultValue,
    validate,
  });

  const classes = [
    'field-type',
    'select',
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
        htmlFor={name}
        label={label}
        required={required}
      />
      <ReactSelect
        onChange={onFieldChange}
        value={formatRenderValue(value)}
        formatValue={formatFormValue}
        showError={showError}
        disabled={formProcessing}
        options={options}
        isMulti={hasMany}
      />
    </div>
  );
};

Select.defaultProps = {
  style: {},
  required: false,
  errorMessage: defaultError,
  validate: defaultValidate,
  defaultValue: null,
  hasMany: false,
  width: undefined,
};

Select.propTypes = {
  required: PropTypes.bool,
  style: PropTypes.shape({}),
  errorMessage: PropTypes.string,
  label: PropTypes.string.isRequired,
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
  ]),
  validate: PropTypes.func,
  name: PropTypes.string.isRequired,
  width: PropTypes.string,
  options: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.string,
    ),
    PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string,
      }),
    ),
  ]).isRequired,
  hasMany: PropTypes.bool,
};

export default withCondition(Select);
