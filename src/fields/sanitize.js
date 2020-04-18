const { MissingFieldType } = require('../errors');
const validations = require('./validations');

const sanitizeFields = (fields) => {
  return fields.map((unsanitizedField) => {
    const field = { ...unsanitizedField };

    if (!field.type) throw new MissingFieldType(field);

    if (typeof field.validation === 'undefined') {
      field.validation = validations[field.type];
    }

    if (!field.hooks) field.hooks = {};

    if (field.localized && field.required) {
      field.required = false;
    }

    if (field.fields) field.fields = sanitizeFields(field.fields);

    return field;
  });
};

module.exports = sanitizeFields;
