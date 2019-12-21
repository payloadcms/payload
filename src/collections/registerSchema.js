import mongoose from 'mongoose';
import validate from './validate';
import baseFields from '../mongoose/schema/baseFields';
import fieldToSchemaMap from '../mongoose/schema/fieldToSchemaMap';
import paginate from '../mongoose/paginate';
import buildQueryPlugin from '../mongoose/buildQuery';
import localizationPlugin from '../localization/plugin';
import autopopulate from '../mongoose/autopopulate';
import passwordResetConfig from '../auth/passwordResets/config';

const registerSchema = (collection, collections, config) => {
  validate(collection, collections);
  const fields = { ...baseFields };

  if (collection.auth) {
    collection.fields.push(...passwordResetConfig.fields);
  }

  collection.fields.forEach((field) => {
    const fieldSchema = fieldToSchemaMap[field.type];
    if (fieldSchema) fields[field.name] = fieldSchema(field, { localization: config.localization });
  });

  const Schema = new mongoose.Schema(fields, { timestamps: collection.timestamps })
    .plugin(paginate)
    .plugin(buildQueryPlugin)
    .plugin(localizationPlugin, config.localization)
    .plugin(autopopulate);

  if (collection.plugins) {
    collection.plugins.forEach((plugin) => {
      Schema.plugin(plugin.plugin, plugin.options);
    });
  }

  return {
    ...collections,
    [collection.slug]: {
      config: collection,
      model: mongoose.model(collection.slug, Schema),
    },
  };
};

export default registerSchema;
