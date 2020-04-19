/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const { ValidationError } = require('../errors');

const iterateFields = async (fields, data, errors, path = '') => {
  if (Array.isArray(data)) {
    await Promise.all(data.map(async (row, i) => {
      await iterateFields(fields, row, errors, `${path}.${i}.`);
    }));
  } else {
    for (const field of fields) {
      if (field.required) {
        const validationResult = await field.validate(data[field.name], field);

        if (validationResult !== true) {
          errors.push({
            field: field.name,
            message: validationResult,
          });
        }
      }

      if (field.fields) {
        await iterateFields(field.fields, data[field.name], errors, `${path}${field.name}.`);
      }
    }
  }
};

const validate = async (fields, data) => {
  const errors = [];
  await iterateFields(fields, data, errors);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

module.exports = validate;
