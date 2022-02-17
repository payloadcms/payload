import React, { useEffect, useState } from 'react';
import { Checkbox, Text, useForm } from 'payload/components/forms';
import RadioGroup from 'payload/dist/admin/components/forms/field-types/RadioGroup';
import { Props as TextFieldType } from 'payload/dist/admin/components/forms/field-types/Text/types';

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

        const { fields: allFields } = getData();
        const field = allFields.find(field => field.id === fieldToUse);

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

  if (valueType === 'static') {
    return (
      <Text {...props} />
    )
  }

  if (valueType === 'dynamic' && !isNumberField) {
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
          The selected field must be of type number to be dynamic.
        </div>
      </div>
    )
  }

  return null
};
