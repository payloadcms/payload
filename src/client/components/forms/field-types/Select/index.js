import React from 'react';
import PropTypes from 'prop-types';
import ReactSelect from '../../../modules/ReactSelect';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const defaultError = 'Please make a selection.';
const defaultValidate = value => value.length > 0;

const Select = (props) => {
  const {
    name,
    required,
    defaultValue,
    valueOverride,
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
    valueOverride,
    validate,
  });

  const classes = [
    'field-type',
    'select',
    showError && 'error',
  ].filter(Boolean).join(' ');

  const fieldWidth = width ? `${width}%` : undefined;

  // console.log(defaultValue);

  // Todo: revise defaultValue.
  // Use this category: http://localhost:3000/admin/collections/categories/5e2904bfc47ddb0aae200ad0

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
      <ReactSelect
        onChange={onFieldChange}
        value={value}
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
  valueOverride: null,
  defaultValue: null,
  hasMany: false,
  width: 100,
};

Select.propTypes = {
  required: PropTypes.bool,
  style: PropTypes.shape({}),
  errorMessage: PropTypes.string,
  valueOverride: PropTypes.string,
  label: PropTypes.string.isRequired,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  name: PropTypes.string.isRequired,
  width: PropTypes.number,
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

export default Select;
