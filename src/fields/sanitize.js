const { MissingFieldType } = require('../errors');
const validations = require('./validations');


const sanitizeFields = (fields) => {
  return fields.map((unsanitizedField) => {
    const field = { ...unsanitizedField };

    if (!field.type) throw new MissingFieldType(field);

    if (typeof field.validation === 'undefined') {
      field.validation = validations[field.type];
    }

    if (field.localized && field.required) {
      field.required = false;
    }

    return field;
  });
};

module.exports = sanitizeFields;
