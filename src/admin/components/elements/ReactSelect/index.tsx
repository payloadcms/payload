import React from 'react';
import Select from 'react-select';
import { Props } from './types';
import Chevron from '../../icons/Chevron';

import './index.scss';

const ReactSelect: React.FC<Props> = (props) => {
  const {
    showError = false,
    options,
    isMulti = false,
    onChange,
    value,
    disabled = false,
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
          let valueToChange;

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

export default ReactSelect;
