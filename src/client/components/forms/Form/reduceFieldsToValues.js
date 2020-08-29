import { unflatten } from 'flatley';

const reduceFieldsToValues = (fields, flatten) => {
  const data = {};

  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && fields[key].value !== undefined) {
      data[key] = fields[key].value;
    }
  });

  if (flatten) {
    return unflatten(data, { safe: true });
  }

  return data;
};

export default reduceFieldsToValues;
