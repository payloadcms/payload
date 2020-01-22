import React from 'react';
import PropTypes from 'prop-types';
import ReactSelect from 'react-select';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import Arrow from '../../../graphics/Arrow';

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
        value={options.find(option => option.value === value)}
        onChange={(selected) => {
          if (hasMany) {
            if (selected) {
              onFieldChange(selected.map(selectedOption => selectedOption.value));
            } else {
              onFieldChange(null);
            }
          }
          if (selected) {
            onFieldChange(selected.value);
          }
        }}
        disabled={formProcessing ? 'disabled' : undefined}
        components={{ DropdownIndicator: Arrow }}
        className="react-select"
        classNamePrefix="rs"
        isMulti={hasMany}
        id={name}
        name={name}
        options={options.map((option) => {
          let optionValue = option;
          let optionLabel = option;

          if (typeof option === 'object') {
            optionValue = option.value;
            optionLabel = option.label;
          }

          return {
            value: optionValue,
            label: optionLabel,
          };
        })}
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
  name: 'select',
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
  name: PropTypes.string,
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
