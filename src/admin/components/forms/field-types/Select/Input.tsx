import React from 'react';
import { useTranslation } from 'react-i18next';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { OptionObject, SelectField } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';
import ReactSelect from '../../../elements/ReactSelect';
import { Option } from '../../../elements/ReactSelect/types';
import { getTranslation } from '../../../../../utilities/getTranslation';

import './index.scss';

export type SelectInputProps = Omit<SelectField, 'type' | 'value' | 'options'> & {
  showError?: boolean
  errorMessage?: string
  readOnly?: boolean
  path: string
  required?: boolean
  value?: string | string[]
  description?: Description
  onChange?: (value: Option) => void
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

  const { i18n } = useTranslation();

  const classes = [
    'field-type',
    'select',
    className,
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  let valueToRender;

  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map((val) => {
      const matchingOption = options.find((option) => option.value === val);
      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
        value: matchingOption?.value ?? val,
      };
    });
  } else if (value) {
    const matchingOption = options.find((option) => option.value === value);
    valueToRender = {
      label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
      value: matchingOption?.value ?? value,
    };
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
        value={valueToRender as Option}
        showError={showError}
        disabled={readOnly}
        options={options.map((option) => ({ ...option, label: getTranslation(option.label, i18n) }))}
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
