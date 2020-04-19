/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const { ValidationError } = require('../errors');

const validateUpdate = async (data, fields) => {
  let errors = [];

  for (const key of Object.keys(data)) {
    const dataToValidate = data[key];
    const field = fields.find(matchedField => matchedField.name === key);

    if (field) {
      const validationResult = await field.validate(dataToValidate, field);

      if (Array.isArray(validationResult)) {
        errors = [
          ...errors,
          ...validationResult,
        ];
      } else if (validationResult !== true) {
        errors.push({
          field: field.name,
          message: validationResult,
        });
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};

module.exports = validateUpdate;
