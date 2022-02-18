import React, { useEffect, useState } from 'react';
import { Text, useForm } from 'payload/components/forms';
import { Props as TextFieldType } from 'payload/dist/admin/components/forms/field-types/Text/types';
import { Data } from 'payload/dist/admin/components/forms/Form/types';

type FieldWithID = { id: string };

export const DynamicPriceSelector: React.FC<TextFieldType> = (props) => {
  const {
    path,
    label
  } = props;

  const {
    fields,
    getDataByPath,
    getData
  } = useForm();

  const [isNumberField, setIsNumberField] = useState<boolean>();
  const [valueType, setValueType] = useState<string>();

  // only number fields can set 'valueType' to 'valueOfField`
  useEffect(() => {
    if (path) {
      const parentPath = path.split('.').slice(0, -1).join('.')
      const paymentFieldData: any = getDataByPath(parentPath);
      if (paymentFieldData) {
        const {
          fieldToUse,
          valueType
        } = paymentFieldData;

        setValueType(valueType);

        const { fields: allFields }: Data = getData();
        const field = allFields.find((field: FieldWithID) => field.id === fieldToUse);

        if (field) {
          const { blockType } = field;
          setIsNumberField(blockType === 'number');
        }
      }
    }
  }, [
    fields,
    path,
    getDataByPath,
    getData
  ]);

  // TODO: make this a number field, block by Payload
  if (valueType === 'static') {
    return (
      <Text {...props} />
    )
  }

  if (valueType === 'valueOfField' && !isNumberField) {
    return (
      <div>
        <div>
          {label}
        </div>
        <div
          style={{
            color: '#9A9A9A',
          }}
        >
          The selected field must be a number field.
        </div>
      </div>
    )
  }

  return null
};
