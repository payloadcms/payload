import { Field } from '../../../../../fields/config/types';
import validations from '../../../../../fields/validations';

const formatFields = (collection, isEditing) => {
  let fields = [
    ...collection.fields,
  ];
  if (collection.idType && !isEditing) {
    const defaultValidate = validations[collection.idType];
    fields = [
      {
        name: 'id',
        type: collection.idType,
        label: 'ID',
        required: true,
        validate: (val) => defaultValidate(val, { required: true }),
      } as Field,
      ...fields,
    ];
  }
  return fields;
};

export default formatFields;
