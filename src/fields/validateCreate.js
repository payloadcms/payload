/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const { ValidationError } = require('../errors');

exports.iterateFields = async (data, fields, path = '') => {
  let errors = [];

  for (const field of fields) {
    const requiresAtLeastOneSubfield = field.fields && field.fields.some(subField => (subField.required && !subField.localized));

    if (field.required || requiresAtLeastOneSubfield) {
      if (data && data[field.name] !== null) {
        const validationResult = await field.validate(data[field.name], field);

        if (Array.isArray(validationResult)) {
          errors = [
            ...errors,
            ...validationResult,
          ];
        } else if (validationResult !== true) {
          errors.push({
            field: `${path}${field.name}`,
            message: validationResult,
          });
        }
      } else {
        errors.push({
          field: `${path}${field.name}`,
          message: `${path}${field.name} is required.`,
        });
      }
    }
  }

  return errors;
};

exports.validateCreate = async (data, fields) => {
  const errors = await exports.iterateFields(data, fields);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};
