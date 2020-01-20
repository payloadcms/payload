import React from 'react';
import PropTypes from 'prop-types';
import fieldType from '../fieldType';

import './index.scss';
import useMountEffect from '../../../../hooks/useMountEffect';

const errorMessage = 'Please fill in the textarea';

const validate = value => value.length > 0;

const Select = (props) => {
  const {
    className,
    style,
    error,
    label,
    value,
    onChange,
    disabled,
    placeholder,
    id,
    name,
    options,
    sendField,
    defaultValue,
  } = props;

  useMountEffect(() => {
    let initialValue = defaultValue;

    if (!initialValue) {
      if (typeof options[0] === 'object') {
        initialValue = options[0].value;
      } else {
        [initialValue] = options;
      }
    }

    sendField(initialValue);
  });

  return (
    <div
      className={className}
      style={style}
    >
      {error}
      {label}
      <select
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        id={id || name}
        name={name}
      >
        {options && options.map((option, i) => {
          let optionValue = option;
          let optionLabel = option;

          if (typeof option === 'object') {
            optionValue = option.value;
            optionLabel = option.label;
          }

          return (
            <option
              key={i}
              value={optionValue}
              selected={value === optionValue ? 'selected' : undefined}
            >
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};

Select.defaultProps = {
  className: null,
  style: {},
  error: null,
  label: null,
  value: '',
  onChange: null,
  disabled: null,
  placeholder: null,
  id: null,
  name: 'select',
  defaultValue: '',
};

Select.propTypes = {
  sendField: PropTypes.func.isRequired,
  className: PropTypes.string,
  style: PropTypes.shape({}),
  error: PropTypes.node,
  label: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.string,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  defaultValue: PropTypes.string,
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

export default fieldType(Select, 'select', validate, errorMessage);
