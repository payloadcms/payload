import React from 'react';

import Error from '../../Error';
import Label from '../../Label';
import FieldDescription from '../../FieldDescription';
import RadioInput from './RadioInput';
import { optionIsObject, RadioField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
import { OnChange } from './types';

import './index.scss';

const baseClass = 'radio-group';

export type RadioGroupInputProps = Omit<RadioField, 'type'> & {
  showError?: boolean
  errorMessage?: string
  readOnly?: boolean
  path?: string
  required?: boolean
  layout?: 'horizontal' | 'vertical'
  description?: Description
  onChange?: OnChange
  value?: string
  placeholder?: string
  style?: React.CSSProperties
  className?: string
  width?: string
}

const RadioGroupInput: React.FC<RadioGroupInputProps> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    label,
    readOnly,
    layout = 'horizontal',
    style,
    className,
    width,
    description,
    onChange,
    value,
    showError,
    errorMessage,
    options,
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
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
      </div>
      <Label
        htmlFor={`field-${path}`}
        label={label}
        required={required}
      />
      <ul
        id={`field-${path.replace(/\./gi, '__')}`}
        className={`${baseClass}--group`}
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
                path={path}
                isSelected={isSelected}
                option={optionIsObject(option) ? option : { label: option, value: option }}
                onChange={readOnly ? undefined : onChange}
              />
            </li>
          );
        })}
      </ul>
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default RadioGroupInput;
