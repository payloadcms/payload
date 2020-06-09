const { MissingFieldType } = require('../errors');
const validations = require('./validations');

const sanitizeFields = (fields) => {
  return fields.map((unsanitizedField) => {
    const field = { ...unsanitizedField };

    if (!field.type) throw new MissingFieldType(field);

    if (typeof field.validate === 'undefined') {
      const defaultValidate = validations[field.type];
      const noValidate = () => true;
      field.validate = defaultValidate || noValidate;
    }

    if (!field.hooks) field.hooks = {};

    if (field.fields) field.fields = sanitizeFields(field.fields);

    if (field.blocks) {
      field.blocks = field.blocks.map((block) => {
        const unsanitizedBlock = { ...block };
        unsanitizedBlock.fields = sanitizeFields(block.fields);
        return unsanitizedBlock;
      });
    }

    return field;
  });
};

module.exports = sanitizeFields;
