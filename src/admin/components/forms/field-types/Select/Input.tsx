import React from 'react';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { SelectField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
import ReactSelect from '../../../elements/ReactSelect';
import { Value as ReactSelectValue, Options as ReactSelectOptions } from '../../../elements/ReactSelect/types';
// import { FieldType } from '../../useField/types';

import './index.scss';

export type SelectInputProps = Omit<SelectField, 'type' | 'value'> & {
  showError: boolean
  errorMessage?: string
  readOnly?: boolean
  path?: string
  required?: boolean
  value?: string
  description?: Description
  onChange?: (value: ReactSelectValue) => void
  style?: React.CSSProperties
  width?: string
  hasMany?: boolean
  options?: ReactSelectOptions
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
    width,
    options,
    hasMany,
  } = props;

  const classes = [
    'field-type',
    'select',
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div
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
        htmlFor={path}
        label={label}
        required={required}
      />
      <ReactSelect
        onChange={onChange}
        value={selectedOption}
        showError={showError}
        isDisabled={readOnly}
        options={options}
        isMulti={hasMany}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default SelectInput;
