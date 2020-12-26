import React, { useCallback, useState } from 'react';
import withCondition from '../../withCondition';
import ReactSelect from '../../../elements/ReactSelect';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
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
    } = {},
  } = props;

  const path = pathFromProps || name;

  const [options] = useState(formatOptions(optionsFromProps));

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required, options });
    return validationResult;
  }, [validate, required, options]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useFieldType({
    path,
    validate: memoizedValidate,
  });

  const classes = [
    'field-type',
    baseClass,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ].filter(Boolean).join(' ');

  const valueToRender = options.find((option) => option.value === value);

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
        onChange={!readOnly ? (selectedOption) => {
          setValue(selectedOption.value);
        } : undefined}
        value={valueToRender}
        showError={showError}
        isDisabled={readOnly}
        options={options}
        isMulti={hasMany}
      />
    </div>
  );
};

export default withCondition(Select);
