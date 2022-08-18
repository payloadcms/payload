import React from 'react';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { OptionObject, SelectField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
import ReactSelect from '../../../elements/ReactSelect';
import { Value as ReactSelectValue } from '../../../elements/ReactSelect/types';
// import { FieldType } from '../../useField/types';

import './index.scss';

export type SelectInputProps = Omit<SelectField, 'type' | 'value' | 'options'> & {
  showError?: boolean
  errorMessage?: string
  readOnly?: boolean
  path: string
  required?: boolean
  value?: string | string[]
  description?: Description
  onChange?: (value: ReactSelectValue) => void
  style?: React.CSSProperties
  className?: string
  width?: string
  hasMany?: boolean
  isSortable?: boolean
  options?: OptionObject[]
  isClearable?: boolean
}

const SelectInput: React.FC<SelectInputProps> = (props) => {
  const {
    showError,
    errorMessage,
    readOnly,
    path,
    label,
    required,
    value,
    onChange,
    description,
    style,
    className,
    width,
    options,
    hasMany,
    isSortable,
    isClearable,
  } = props;

  const classes = [
    'field-type',
    'select',
    className,
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  let valueToRender;

  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map((val) => options.find((option) => option.value === val));
  } else {
    valueToRender = options.find((option) => option.value === value);
  }

  return (
    <div
      id={`field-${path.replace(/\./gi, '__')}`}
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={`field-${path.replace(/\./gi, '__')}`}
        label={label}
        required={required}
      />
      <ReactSelect
        onChange={onChange}
        value={valueToRender as ReactSelectValue}
        showError={showError}
        isDisabled={readOnly}
        options={options}
        isMulti={hasMany}
        isSortable={isSortable}
        isClearable={isClearable}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default SelectInput;
