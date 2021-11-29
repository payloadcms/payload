import React from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { text } from '../../../../../fields/validations';
import { Props } from './types';
import TextInput from './Input';

const Text: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = text,
    label,
    admin: {
      placeholder,
      readOnly,
      style,
      width,
      description,
      condition,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const field = useField<string>({
    path,
    validate,
    enableDebouncedValue: true,
    condition,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = field;

  return (
    <TextInput
      name={name}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      showError={showError}
      errorMessage={errorMessage}
      required={required}
      label={label}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      style={style}
      width={width}
      description={description}
    />
  );
};

export default withCondition(Text);
