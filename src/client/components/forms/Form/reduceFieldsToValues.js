import { unflatten } from 'flatley';

const reduceFieldsToValues = (fields, flatten) => {
  const data = {};

  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && fields[key].value !== undefined) {
      data[key] = fields[key].value;
    }
  });

  if (flatten) {
    const unflattened = unflatten(data, { safe: true });
    return unflattened;
  }

  return data;
};

export default reduceFieldsToValues;
