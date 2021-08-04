import { Field } from '../../../../../fields/config/types';

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
      } as Field,
      ...fields,
    ];
  }
  return fields;
};

export default formatFields;
