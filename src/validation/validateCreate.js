const { ValidationError } = require('../errors');
const { createValidationPromise, getErrorResults } = require('./utilities');

const iterateFields = async (data, fields, path = '') => {
  const validationPromises = [];

  fields.forEach((field) => {
    const dataToValidate = data || {};

    if (!field.condition) {
      // If this field does not have a name, it is for
      // admin panel composition only and should not be
      // validated against directly
      if (field.name === undefined && field.fields) {
        field.fields.forEach((subField) => {
          validationPromises.push(createValidationPromise(dataToValidate[subField.name], subField));
        });
      } else if (field.fields) {
        if (field.type === 'repeater' || field.type === 'flexible') {
          const isArray = Array.isArray(dataToValidate[field.name]);
          const rowCount = isArray ? dataToValidate[field.name].length : 0;
          validationPromises.push(createValidationPromise(rowCount, field));

          if (isArray) {
            dataToValidate[field.name].forEach((rowData, i) => {
              validationPromises.push(iterateFields(rowData, field.fields, `${path}${field.name}.${i}.`));
            });
          }
        } else {
          validationPromises.push(iterateFields(dataToValidate[field.name], field.fields, `${path}${field.name}.`));
        }
      } else {
        validationPromises.push(createValidationPromise(dataToValidate[field.name], field));
      }
    }
  });

  return getErrorResults(validationPromises, path);
};

module.exports = async (data, fields) => {
  try {
    const errors = await iterateFields(data, fields);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  } catch (error) {
    throw error;
  }
};
