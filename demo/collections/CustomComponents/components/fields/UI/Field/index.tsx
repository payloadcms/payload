import React, { useCallback } from 'react';
import TextInput from '../../../../../../../src/admin/components/forms/field-types/Text';
import { UIField as UIFieldType } from '../../../../../../../src/fields/config/types';
import SelectInput from '../../../../../../../src/admin/components/forms/field-types/Select';

const UIField: React.FC<UIFieldType> = () => {
  const [textValue, setTextValue] = React.useState('');
  const [selectValue, setSelectValue] = React.useState('');

  const onTextChange = useCallback((incomingValue) => {
    setTextValue(incomingValue);
  }, [])

  const onSelectChange = useCallback((incomingValue) => {
    setSelectValue(incomingValue);
  }, [])

  return (
    <div>
      <TextInput
        name="ui-text"
        label="Presentation-only text field (does not submit)"
        value={textValue as string}
        onChange={onTextChange}
      />
      <SelectInput
        name="ui-select"
        label="Presentation-only select field (does not submit)"
        options={[
          {
            label: 'Option 1',
            value: 'option-1'
          },
          {
            label: 'Option 2',
            value: 'option-2'
          },
          {
            label: 'Option 3',
            value: 'option-4'
          }
        ]}
        value={selectValue as string}
        onChange={onSelectChange}
      />
    </div>
  )
};

export default UIField;
