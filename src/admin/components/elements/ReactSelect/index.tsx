import React from 'react';
import Select, { OptionsType } from 'react-select';
import { Props, Value } from './types';
import Chevron from '../../icons/Chevron';

import './index.scss';

const ReactSelect: React.FC<Props> = (props) => {
  const {
    showError = false,
    options,
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
      onChange={(selected: Value) => {
        if (formatValue) {
          onChange(formatValue(selected));
        } else {
          let valueToChange: string | string[];

          if (Array.isArray(selected)) {
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
            valueToChange = (selected as Value).value;
          }
          onChange(valueToChange);
        }
      }}
      disabled={disabled ? 'disabled' : undefined}
      components={{ DropdownIndicator: Chevron }}
      className={classes}
      classNamePrefix="rs"
      options={(options as OptionsType<Value>).map((option) => {
        if (typeof option === 'string') {
          return {
            value: option,
            label: option,
          };
        }

        return {
          value: option.value,
          label: option.label,
          options: option?.options,
        };
      })}
    />
  );
};

export default ReactSelect;
