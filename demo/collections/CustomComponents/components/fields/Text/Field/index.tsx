import React, { useCallback, useState } from 'react';
import TextInput from '../../../../../../../src/admin/components/forms/field-types/Text';
import { Props as TextFieldType } from '../../../../../../../src/admin/components/forms/field-types/Text/types';

const Text: React.FC<TextFieldType> = (props) => {
  const {
    path,
    name,
    label
  } = props;

  const [internalValue, setInternalValue] = useState('');

  const middleware = useCallback((incomingValue) => {
    setInternalValue(`Hello, world: ${incomingValue}`)
  }, [])

  return (
    <TextInput
      path={path}
      name={name}
      label={label}
      value={internalValue}
      onChange={middleware}
    />
  )
};

export default Text;
