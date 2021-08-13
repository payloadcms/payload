import { Field } from '../../../../../fields/config/types';
import { text } from '../../../../../fields/validations';

const formatFields = (collection, isEditing) => {
  let fields = [
    ...collection.fields,
  ];
  if (collection.id && !isEditing) {
    fields = [
      {
        name: 'id',
        type: 'text',
        label: 'ID',
        required: true,
        validate: (val) => text(val, { required: true }),
      } as Field,
      ...fields,
    ];
  }
  return fields;
};

export default formatFields;
