import React, { useCallback, useEffect, useState } from 'react';
import withCondition from '../../withCondition';
import useField from '../../useField';
import { select } from '../../../../../fields/validations';
import { Option, OptionObject } from '../../../../../fields/config/types';
import { Props } from './types';
import { SelectInput } from './Input';

const formatOptions = (options: Option[]): OptionObject[] => options.map((option) => {
  if (typeof option === 'object' && (option.value || option.value === '')) {
    return option;
  }

  return {
    label: option,
    value: option,
  } as OptionObject;
});

const SelectField: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    validate = select,
    label,
    options: optionsFromProps,
    hasMany,
    required,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      isClearable,
      condition,
      isSortable = true,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const [options, setOptions] = useState(formatOptions(optionsFromProps));

  useEffect(() => {
    setOptions(formatOptions(optionsFromProps));
  }, [optionsFromProps]);

  const memoizedValidate = useCallback((value, validationOptions) => {
    return validate(value, { ...validationOptions, options, hasMany, required });
  }, [validate, required, hasMany, options]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
    path,
    validate: memoizedValidate,
    condition,
  });

  const onChange = useCallback((selectedOption) => {
    if (!readOnly) {
      let newValue;
      if (!selectedOption) {
        newValue = null;
      } else if (hasMany) {
        if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => option.value);
        } else {
          newValue = [];
        }
      } else {
        newValue = selectedOption.value;
      }

      setValue(newValue);
    }
  }, [
    readOnly,
    hasMany,
    setValue,
  ]);

  return (
    <SelectInput
      path={path}
      onChange={onChange}
      value={value as string | string[]}
      name={name}
      options={options}
      label={label}
      showError={showError}
      errorMessage={errorMessage}
      required={required}
      readOnly={readOnly}
      description={description}
      style={style}
      className={className}
      width={width}
      hasMany={hasMany}
      isSortable={isSortable}
      isClearable={isClearable}
    />
  );
};

export const Select = withCondition(SelectField);
