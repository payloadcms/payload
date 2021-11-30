import React, { useCallback, useState } from 'react';
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
      width,
      description,
      condition,
    } = {},
    value: valueFromProps,
    onChange: onChangeFromProps,
  } = props;

  const path = pathFromProps || name;

  const [options] = useState(formatOptions(optionsFromProps));

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required, options });
    return validationResult;
  }, [validate, required, options]);

  const {
    value: valueFromContext,
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

      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newValue);
      } else {
        setValue(newValue);
      }
    }
  }, [
    readOnly,
    hasMany,
    onChangeFromProps,
    setValue,
  ]);

  let valueToRender;

  const value = valueFromProps || valueFromContext || '';

  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map((val) => options.find((option) => option.value === val));
  } else {
    valueToRender = options.find((option) => option.value === value);
  }

  return (
    <SelectInput
      onChange={onChange}
      value={valueToRender}
      name={name}
      options={options}
      label={label}
      showError={showError}
      errorMessage={errorMessage}
      description={description}
      style={style}
      width={width}
      hasMany={hasMany}
    />
  );
};

export default withCondition(Select);
