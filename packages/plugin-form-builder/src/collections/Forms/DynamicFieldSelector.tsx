import React, { useEffect, useState } from 'react';
import { Select, useForm } from 'payload/components/forms';
import { TextField } from 'payload/dist/fields/config/types';

export const DynamicFieldSelector: React.FC<TextField> = (props) => {
  const { fields, getDataByPath } = useForm();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fields: any[] = getDataByPath('fields')
    if (fields) {
      const allNonPaymentFields = fields.map((block) => {
        const {
          name,
          id,
          blockType
        } = block;

        if (blockType !== 'payment') {
          return ({
            label: name,
            value: id
          })
        }

        return null
      }).filter(Boolean);
      setOptions(allNonPaymentFields);
    }
  }, [
    fields,
    getDataByPath
  ]);

  return (
    <Select
      {...props}
      options={options}
    />
  );
};
