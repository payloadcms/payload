import React, { useEffect } from 'react';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import { Props } from './types';

const HiddenInput: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    value: valueFromProps,
  } = props;

  const path = pathFromProps || name;

  const { value, setValue } = useFieldType({
    path,
  });

  useEffect(() => {
    if (valueFromProps !== undefined) {
      setValue(valueFromProps);
    }
  }, [valueFromProps, setValue]);

  return (
    <input
      type="hidden"
      value={value as string || ''}
      onChange={setValue}
      name={path}
    />
  );
};

export default withCondition(HiddenInput);
