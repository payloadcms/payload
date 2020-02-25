const { Schema } = require('mongoose');
const fieldToSchemaMap = require('./fieldToSchemaMap');
const baseFields = require('./baseFields');

const buildSchema = (configFields, config, options = {}, additionalBaseFields = {}) => {
  const fields = { ...baseFields, ...additionalBaseFields };
  const flexiblefields = [];

  configFields.forEach((field) => {
    const fieldSchema = fieldToSchemaMap[field.type];
    if (field.type === 'flexible') {
      flexiblefields.push(field);
    }

    if (fieldSchema) {
      fields[field.name] = fieldSchema(field, config);
    }
  });

  const schema = new Schema(fields, options);

  if (flexiblefields.length > 0) {
    flexiblefields.forEach((field) => {
      if (field.length > 0) {
        field.blocks.forEach((block) => {
          const blockSchemaFields = {};

          block.fields.forEach((blockField) => {
            const fieldSchema = fieldToSchemaMap[blockField.type];
            if (fieldSchema) blockSchemaFields[blockField.name] = fieldSchema(blockField, config);
          });

          const blockSchema = new Schema(blockSchemaFields, { _id: false });
          schema.path(field.name).discriminator(block.labels.singular, blockSchema);
        });
      }
    });
  }

  return schema;
};

module.exports = buildSchema;
