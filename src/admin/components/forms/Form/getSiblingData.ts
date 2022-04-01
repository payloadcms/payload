import { unflatten } from 'flatley';
import { Fields, Data } from './types';
import reduceFieldsToValues from './reduceFieldsToValues';

const getSiblingData = (fields: Fields, path: string): Data => {
  if (path.indexOf('.') === -1) {
    return reduceFieldsToValues(fields, true);
  }
  const siblingFields = {};

  // If this field is nested
  // We can provide a list of sibling fields
  const parentFieldPath = path.substring(0, path.lastIndexOf('.') + 1);
  Object.keys(fields).forEach((fieldKey) => {
    if (!fields[fieldKey].disableFormData && fieldKey.indexOf(parentFieldPath) === 0) {
      siblingFields[fieldKey.replace(parentFieldPath, '')] = fields[fieldKey].value;
    }
  });

  return unflatten(siblingFields, { safe: true });
};

export default getSiblingData;
