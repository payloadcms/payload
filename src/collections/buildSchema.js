const paginate = require('mongoose-paginate-v2');
const buildQueryPlugin = require('../mongoose/buildQuery');
const localizationPlugin = require('../localization/plugin');
const buildSchema = require('../mongoose/buildSchema');

const buildCollectionSchema = (collection, config, schemaOptions = {}) => {
  const schema = buildSchema(collection.fields, { timestamps: collection.timestamps, ...schemaOptions });

  schema.plugin(paginate)
    .plugin(buildQueryPlugin);

  if (config.localization) {
    schema.plugin(localizationPlugin, config.localization);
  }

  return schema;
};

module.exports = buildCollectionSchema;
