import { Schema } from 'mongoose';
import mongooseHidden from 'mongoose-hidden';
import fieldToSchemaMap from './fieldToSchemaMap';
import baseFields from './baseFields';
import localizationPlugin from '../../localization/plugin';

const buildSchema = (configFields, config, options = {}) => {
  const fields = { ...baseFields };
  const flexibleFields = [];

  configFields.forEach((field) => {
    const fieldSchema = fieldToSchemaMap[field.type];
    if (fieldSchema) fields[field.name] = fieldSchema(field, { localization: config.localization });
    if (field.type === 'flexible') flexibleFields.push(field);
  });

  const schema = new Schema(fields, options)
    .plugin(localizationPlugin, config.localization)
    .plugin(mongooseHidden());

  flexibleFields.forEach((field) => {
    field.blocks.forEach((block) => {
      const subSchema = buildSchema(block.fields, config, { _id: false });

      if (field.localized && config.localization && config.localization.locales) {
        config.localization.locales.forEach((locale) => {
          schema.path(`${field.name}.${locale}`).discriminator(block.labels.singular, subSchema);
        });
      } else {
        schema.path(field.name).discriminator(block.labels.singular, subSchema);
      }
    });
  });

  return schema;
};

export default buildSchema;
