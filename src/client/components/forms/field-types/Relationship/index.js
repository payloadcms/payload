import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactSelect from '../../../modules/ReactSelect';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const defaultError = 'Please make a selection.';
const defaultValidate = value => value.length > 0;

const Relationship = (props) => {
  const [options, setOptions] = useState([]);

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
    'relationship',
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
      <ReactSelect
        onChange={onFieldChange}
        value={value}
        disabled={formProcessing}
        options={options}
        isMulti={hasMany}
      />
    </div>
  );
};

Relationship.defaultProps = {
  style: {},
  required: false,
  errorMessage: defaultError,
  validate: defaultValidate,
  valueOverride: null,
  defaultValue: null,
  hasMany: false,
  width: 100,
};

Relationship.propTypes = {
  required: PropTypes.bool,
  style: PropTypes.shape({}),
  errorMessage: PropTypes.string,
  valueOverride: PropTypes.string,
  label: PropTypes.string.isRequired,
  defaultValue: PropTypes.string,
  validate: PropTypes.func,
  name: PropTypes.string.isRequired,
  width: PropTypes.number,
  hasMany: PropTypes.bool,
};

export default Relationship;
