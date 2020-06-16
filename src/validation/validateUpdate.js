const { ValidationError } = require('../errors');
const { createValidationPromise, getErrorResults } = require('./utilities');

const iterateFields = async (data, fields, path = '') => {
  const validationPromises = [];

  Object.entries(data).forEach(([key, value]) => {
    const field = fields.find(matchedField => matchedField.name === key);

    if (field && value !== undefined) {
      if (field.fields) {
        if (field.type === 'repeater' || field.type === 'flexible') {
          const isArray = Array.isArray(value);
          const rowCount = isArray ? value.length : 0;
          validationPromises.push(createValidationPromise(rowCount, field));

          if (isArray) {
            value.forEach((rowData, i) => {
              validationPromises.push(iterateFields(rowData, field.fields, `${path}${field.name}.${i}.`));
            });
          }
        } else {
          validationPromises.push(iterateFields(value, field.fields, `${path}${field.name}.`));
        }
      } else {
        validationPromises.push(createValidationPromise(value, field));
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
