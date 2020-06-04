import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Chevron from '../../icons/Chevron';

import './index.scss';

const ReactSelect = (props) => {
  const {
    showError,
    options,
    isMulti,
    onChange,
    value,
    disabled,
    formatValue,
  } = props;

  const classes = [
    'react-select',
    showError && 'react-select--error',
  ].filter(Boolean).join(' ');

  return (
    <Select
      {...props}
      value={value}
      onChange={(selected) => {
        if (formatValue) {
          onChange(formatValue(selected));
        } else {
          let valueToChange = null;

          if (isMulti) {
            if (selected) {
              valueToChange = selected.map((selectedOption) => {
                if (typeof selectedOption === 'string') {
                  return {
                    label: selectedOption,
                    value: selectedOption,
                  };
                }

                return selectedOption;
              });
            }
          } else if (selected) {
            valueToChange = selected.value;
          }
          onChange(valueToChange);
        }
      }}
      disabled={disabled ? 'disabled' : undefined}
      components={{ DropdownIndicator: Chevron }}
      className={classes}
      classNamePrefix="rs"
      options={options.map((option) => {
        const formattedOption = {
          value: option,
          label: option,
        };

        if (typeof option === 'object') {
          formattedOption.value = option.value;
          formattedOption.label = option.label;

          if (option.options) formattedOption.options = option.options;
        }

        return formattedOption;
      })}
    />
  );
};

ReactSelect.defaultProps = {
  isMulti: false,
  value: null,
  showError: false,
  disabled: false,
  formatValue: null,
  options: [],
  onChange: () => { },
};

ReactSelect.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({}),
  ]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  showError: PropTypes.bool,
  formatValue: PropTypes.func,
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
  ]),
  isMulti: PropTypes.bool,
};

export default ReactSelect;
