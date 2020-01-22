import React from 'react';
import PropTypes from 'prop-types';
import ReactSelect from 'react-select';
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
  } = props;

  const {
    value,
    showError,
    formProcessing,
    onChange,
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

  return (
    <div
      className={classes}
      style={{
        ...style,
        width: width ? `${width}%` : null,
      }}
    >
      <Error showError={showError} message={errorMessage} />
      <Label htmlFor={name} label={label} required={required} />
      <ReactSelect
        value={options.find(option => option.value === value)}
        onChange={selected => onChange(selected.value)}
        disabled={formProcessing ? 'disabled' : undefined}
        id={name}
        name={name}
        options={options.map((option, i) => {
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
  className: null,
  style: {},
  errorMessage: defaultError,
  validate: defaultValidate,
  value: {},
  onChange: null,
  disabled: null,
  placeholder: null,
  id: null,
  name: 'select',
  defaultValue: null,
};

Select.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  errorMessage: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    }),
    PropTypes.string,
  ]),
  defaultValue: PropTypes.string,
  defaultValidate: PropTypes.func,
  onChange: PropTypes.func,
  disabled: PropTypes.string,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
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
};

export default Select;
