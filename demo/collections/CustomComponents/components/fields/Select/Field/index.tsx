import React, { useCallback, useState } from 'react';
import SelectInput from '../../../../../../../src/admin/components/forms/field-types/Select';
import { Props as SelectFieldType } from '../../../../../../../src/admin/components/forms/field-types/Select/types';
import useFieldType from '../../../../../../../src/admin/components/forms/useFieldType';

const Select: React.FC<SelectFieldType> = (props) => {
  const {
    path,
    name,
    label,
    options
  } = props;

  const {
    value,
    setValue
  } = useFieldType({
    path
  });

  const onChange = useCallback((incomingValue) => {
    const sendToCRM = async () => {
      try {
        const req = await fetch('https://fake-crm.com', {
          method: 'post',
          body: JSON.stringify({
            someKey: incomingValue
          })
        });

        const res = await req.json();
        if (res.ok) {
          console.log('Successfully synced to CRM.')
        }
      } catch (e) {
        console.error(e);
      }
    }

    sendToCRM();
    setValue(incomingValue)
  }, [])

  return (
    <SelectInput
      name={name}
      label={label}
      options={options}
      value={value as string}
      onChange={onChange}
    />
  )
};

export default Select;
