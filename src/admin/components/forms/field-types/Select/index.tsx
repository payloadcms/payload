import React, { useCallback, useEffect, useState } from 'react';
import withCondition from '../../withCondition';
import useField from '../../useField';
import { select } from '../../../../../fields/validations';
import { Option, OptionObject } from '../../../../../fields/config/types';
import { Props } from './types';
import SelectInput from './Input';

const formatOptions = (options: Option[]): OptionObject[] => options.map((option) => {
  if (typeof option === 'object' && option.value) {
    return option;
  }

  return {
    label: option,
    value: option,
  } as OptionObject;
});

const Select: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = select,
    label,
    options: optionsFromProps,
    hasMany,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const [options, setOptions] = useState(formatOptions(optionsFromProps));

  useEffect(() => {
    setOptions(formatOptions(optionsFromProps));
  }, [optionsFromProps])

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required, options });
    return validationResult;
  }, [validate, required, options]);

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
      if (hasMany) {
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
      description={description}
      style={style}
      className={className}
      width={width}
      hasMany={hasMany}
    />
  );
};

export default withCondition(Select);
