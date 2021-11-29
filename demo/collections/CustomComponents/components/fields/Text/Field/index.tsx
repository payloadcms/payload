import React, { useCallback } from 'react';
import TextInput from '../../../../../../../src/admin/components/forms/field-types/Text/Input';
import { Props as TextFieldType } from '../../../../../../../src/admin/components/forms/field-types/Text/types';
import useField from '../../../../../../../src/admin/components/forms/useField';

const Text: React.FC<TextFieldType> = (props) => {
  const {
    path,
    name,
    label,
  } = props;

  const field = useField({
    path,
    enableDebouncedValue: true,
  });

  const {
    showError,
    value,
    setValue,
  } = field;

  const onChange = useCallback((e) => {
    const { value: incomingValue } = e.target;
    const valueWithoutSpaces = incomingValue.replace(/\s/g, '');
    setValue(valueWithoutSpaces);
  }, [
    setValue,
  ]);

  return (
    <TextInput
      name={name}
      value={value as string || ''}
      label={label}
      onChange={onChange}
      showError={showError}
    />
  );
};

export default Text;
