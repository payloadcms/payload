import React, { useCallback } from 'react';
import TextAreaInput from '../../../../../../../src/admin/components/forms/field-types/Textarea/Input';
import { Props as TextFieldType } from '../../../../../../../src/admin/components/forms/field-types/Text/types';
import useField from '../../../../../../../src/admin/components/forms/useField';

const TextArea: React.FC<TextFieldType> = (props) => {
  const {
    path,
    name,
    label,
  } = props;

  const field = useField({
    path,
  });

  const {
    showError,
    value,
    setValue,
  } = field;

  const onChange = useCallback((e) => {
    const { value: incomingValue } = e.target;
    setValue(incomingValue);
  }, [
    setValue,
  ]);

  return (
    <TextAreaInput
      name={name}
      value={value as string || ''}
      label={label}
      onChange={onChange}
      showError={showError}
    />
  );
};

export default TextArea;
