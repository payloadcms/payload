import React, { useCallback } from 'react';

import type { Props } from './types.js';

import { radio } from '../../../../../fields/validations.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import RadioGroupInput from './Input.js';

const RadioGroup: React.FC<Props> = (props) => {
  const {
    admin: {
      className,
      condition,
      description,
      layout = 'horizontal',
      readOnly,
      style,
      width,
    } = {},
    label,
    name,
    options,
    path: pathFromProps,
    required,
    validate = radio,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, validationOptions) => {
    return validate(value, { ...validationOptions, options, required });
  }, [validate, options, required]);

  const {
    errorMessage,
    setValue,
    showError,
    value,
  } = useField<string>({
    condition,
    path,
    validate: memoizedValidate,
  });

  return (
    <RadioGroupInput
      className={className}
      description={description}
      errorMessage={errorMessage}
      label={label}
      layout={layout}
      name={name}
      onChange={readOnly ? undefined : setValue}
      options={options}
      path={path}
      required={required}
      showError={showError}
      style={style}
      value={value}
      width={width}
    />
  );
};

export default withCondition(RadioGroup);
