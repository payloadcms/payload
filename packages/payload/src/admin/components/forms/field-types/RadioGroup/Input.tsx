import React from 'react';

import type { RadioField } from '../../../../../fields/config/types';
import type { Description } from '../../FieldDescription/types';
import type { OnChange } from './types';

import { optionIsObject } from '../../../../../fields/config/types';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import Label from '../../Label';
import RadioInput from './RadioInput';
import './index.scss';

const baseClass = 'radio-group';

export type RadioGroupInputProps = Omit<RadioField, 'type'> & {
  className?: string
  description?: Description
  errorMessage?: string
  layout?: 'horizontal' | 'vertical'
  onChange?: OnChange
  path?: string
  placeholder?: string
  readOnly?: boolean
  required?: boolean
  showError?: boolean
  style?: React.CSSProperties
  value?: string
  width?: string
}

const RadioGroupInput: React.FC<RadioGroupInputProps> = (props) => {
  const {
    className,
    description,
    errorMessage,
    label,
    layout = 'horizontal',
    name,
    onChange,
    options,
    path: pathFromProps,
    readOnly,
    required,
    showError,
    style,
    value,
    width,
  } = props;

  const path = pathFromProps || name;

  const classes = [
    'field-type',
    baseClass,
    className,
    `${baseClass}--layout-${layout}`,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ].filter(Boolean).join(' ');

  return (
    <div
      style={{
        ...style,
        width,
      }}
      className={classes}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error
          message={errorMessage}
          showError={showError}
        />
      </div>
      <Label
        htmlFor={`field-${path}`}
        label={label}
        required={required}
      />
      <ul
        className={`${baseClass}--group`}
        id={`field-${path.replace(/\./g, '__')}`}
      >
        {options.map((option) => {
          let optionValue = '';

          if (optionIsObject(option)) {
            optionValue = option.value;
          } else {
            optionValue = option;
          }

          const isSelected = String(optionValue) === String(value);

          return (
            <li key={`${path} - ${optionValue}`}>
              <RadioInput
                isSelected={isSelected}
                onChange={readOnly ? undefined : onChange}
                option={optionIsObject(option) ? option : { label: option, value: option }}
                path={path}
              />
            </li>
          );
        })}
      </ul>
      <FieldDescription
        description={description}
        value={value}
      />
    </div>
  );
};

export default RadioGroupInput;
