import React, { useCallback } from 'react';
import SelectInput from '../../../../../../../src/admin/components/forms/field-types/Select/Input';
import { Props as SelectFieldType } from '../../../../../../../src/admin/components/forms/field-types/Select/types';
import useField from '../../../../../../../src/admin/components/forms/useField';

const Select: React.FC<SelectFieldType> = (props) => {
  const {
    path,
    name,
    label,
    options,
  } = props;

  const {
    showError,
    value,
    setValue,
  } = useField({
    path,
  });

  const onChange = useCallback((incomingOption) => {
    const { value: incomingValue } = incomingOption;

    const sendToCRM = async () => {
      try {
        const req = await fetch('https://fake-crm.com', {
          method: 'post',
          body: JSON.stringify({
            someKey: incomingValue,
          }),
        });

        const res = await req.json();
        if (res.ok) {
          console.log('Successfully synced to CRM.'); // eslint-disable-line no-console
        }
      } catch (e) {
        console.error(e);
      }
    };

    sendToCRM();
    setValue(incomingValue);
  }, [
    setValue,
  ]);

  return (
    <SelectInput
      name={name}
      label={label}
      options={options}
      value={value as string}
      onChange={onChange}
      showError={showError}
    />
  );
};

export default Select;
