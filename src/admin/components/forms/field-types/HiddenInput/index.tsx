import React, { useEffect } from 'react';
import withCondition from '../../withCondition';
import { Props } from './types';
import { useFormFields } from '../../Form/context';

const HiddenInput: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    value: valueFromProps,
  } = props;

  const path = pathFromProps || name;

  const field = useFormFields(([fields]) => fields[path]);
  const dispatchField = useFormFields(([, dispatch]) => dispatch);

  useEffect(() => {
    if (valueFromProps !== undefined) {
      dispatchField({
        type: 'UPDATE',
        path,
        value: valueFromProps,
      });
    }
  }, [valueFromProps, dispatchField, path]);

  return (
    <input
      id={`field-${path.replace(/\./gi, '__')}`}
      type="hidden"
      value={field?.value as string || ''}
      name={path}
    />
  );
};

export default withCondition(HiddenInput);
