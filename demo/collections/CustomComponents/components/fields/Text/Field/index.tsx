import React, { useCallback, useState } from 'react';
import TextInput from '../../../../../../../src/admin/components/forms/field-types/Text';
import { Props as TextFieldType } from '../../../../../../../src/admin/components/forms/field-types/Text/types';
import useField from '../../../../../../../src/admin/components/forms/useField';

const Text: React.FC<TextFieldType> = (props) => {
  const {
    path,
    name,
    label
  } = props;

  const {
    value,
    setValue
  } = useField({
    path
  });

  const onChange = useCallback((incomingValue) => {
    const valueWithoutSpaces = incomingValue.replace(/\s/g, '');
    setValue(valueWithoutSpaces)
  }, [])

  return (
    <TextInput
      name={name}
      label={label}
      value={value as string}
      onChange={onChange}
    />
  )
};

export default Text;
