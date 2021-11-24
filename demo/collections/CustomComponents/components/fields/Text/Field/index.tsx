import React, { useCallback, useState } from 'react';
import TextInput from '../../../../../../../src/admin/components/forms/field-types/Text';
import { Props as TextFieldType } from '../../../../../../../src/admin/components/forms/field-types/Text/types';
import useFieldType from '../../../../../../../src/admin/components/forms/useFieldType';

const Text: React.FC<TextFieldType> = (props) => {
  const {
    path,
    name,
    label
  } = props;

  const {
    value,
    setValue
  } = useFieldType({
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
