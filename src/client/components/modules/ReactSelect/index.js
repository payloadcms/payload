import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Arrow from '../../graphics/Arrow';

import './index.scss';

const ReactSelect = (props) => {
  const {
    showError,
    options,
    isMulti,
    onChange,
    value,
    disabled,
  } = props;

  const classes = [
    'react-select',
    showError && 'react-select-error',
  ].filter(Boolean).join(' ');

  return (
    <Select
      value={options.find(option => option.value === value)}
      onChange={(selected) => {
        let valueToChange = null;

        if (isMulti) {
          if (selected) {
            valueToChange = selected.map(selectedOption => selectedOption.value);
          }
        }

        if (selected) {
          valueToChange = selected.value;
        }

        onChange(valueToChange);
      }}
      disabled={disabled ? 'disabled' : undefined}
      components={{ DropdownIndicator: Arrow }}
      className={classes}
      classNamePrefix="rs"
      isMulti={isMulti}
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
  );
};

ReactSelect.defaultProps = {
  isMulti: false,
  value: null,
  showError: false,
  disabled: false,
};

ReactSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  showError: PropTypes.bool,
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
  isMulti: PropTypes.bool,
};

export default ReactSelect;
