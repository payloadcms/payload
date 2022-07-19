import React, { useEffect } from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { Props } from './types';

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
