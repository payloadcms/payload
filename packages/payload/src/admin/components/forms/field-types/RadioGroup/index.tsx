import React, { useCallback } from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { radio } from '../../../../../fields/validations';
import { Props } from './types';
import RadioGroupInput from './Input';

const RadioGroup: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = radio,
    label,
    admin: {
      readOnly,
      layout = 'horizontal',
      style,
      className,
      width,
      description,
      condition,
    } = {},
    options,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, validationOptions) => {
    return validate(value, { ...validationOptions, options, required });
  }, [validate, options, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useField<string>({
    path,
    validate: memoizedValidate,
    condition,
  });

  return (
    <RadioGroupInput
      path={path}
      name={name}
      onChange={readOnly ? undefined : setValue}
      value={value}
      showError={showError}
      errorMessage={errorMessage}
      required={required}
      label={label}
      layout={layout}
      style={style}
      className={className}
      width={width}
      description={description}
      options={options}
    />
  );
};

export default withCondition(RadioGroup);
