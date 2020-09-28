import { unflatten } from 'flatley';

const reduceFieldsToValues = (fields, flatten) => {
  const data = {};

  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && fields[key].value !== undefined) {
      if (fields[key].stringify) {
        console.log(key);
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
