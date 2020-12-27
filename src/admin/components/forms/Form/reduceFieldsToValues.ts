import { unflatten } from 'flatley';
import { Fields, Data } from './types';

const reduceFieldsToValues = (fields: Fields, flatten?: boolean): Data => {
  const data = {};

  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && fields[key].value !== undefined) {
      if (fields[key].stringify) {
        data[key] = JSON.stringify(fields[key].value);
      } else {
        data[key] = fields[key].value;
      }
    }
  });

  if (flatten) {
    const unflattened = unflatten(data, { safe: true });
    return unflattened;
  }

  return data;
};

export default reduceFieldsToValues;
