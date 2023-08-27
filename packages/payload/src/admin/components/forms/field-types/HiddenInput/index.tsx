import React, { useEffect } from 'react';
import useField from '../../useField.js';
import withCondition from '../../withCondition.js';
import { Props } from './types.js';

const HiddenInput: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    value: valueFromProps,
    disableModifyingForm = true,
  } = props;

  const path = pathFromProps || name;

  const { value, setValue } = useField({
    path,
  });

  useEffect(() => {
    if (valueFromProps !== undefined) {
      setValue(valueFromProps, disableModifyingForm);
    }
  }, [valueFromProps, setValue, disableModifyingForm]);

  return (
    <input
      id={`field-${path.replace(/\./gi, '__')}`}
      type="hidden"
      value={value as string || ''}
      onChange={setValue}
      name={path}
    />
  );
};

export default withCondition(HiddenInput);
