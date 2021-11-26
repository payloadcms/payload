import React, { useCallback, useState, useEffect } from 'react';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { select } from '../../../../../fields/validations';
import { Option } from '../../../../../fields/config/types';
import { Props, Option as ReactSelectOption } from './types';

import './index.scss';

const baseClass = 'select';

const formatOptions = (options: Option[]): ReactSelectOption[] => options.map((option) => {
  if (typeof option === 'object' && option.value) {
    return option;
  }

  return {
    label: option as string,
    value: option,
  };
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
    onChange: onChangeFromProps
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
    setValue
  ])

  const classes = [
    'field-type',
    baseClass,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ].filter(Boolean).join(' ');

  let valueToRender;

  const value = valueFromProps || valueFromContext || '';

  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map((val) => options.find((option) => option.value === val));
  } else {
    valueToRender = options.find((option) => option.value === value);
  }

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
        value={valueToRender}
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

export default withCondition(Select);
