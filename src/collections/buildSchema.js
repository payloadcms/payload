const paginate = require('mongoose-paginate-v2');
const autopopulate = require('mongoose-autopopulate');
const buildQueryPlugin = require('../mongoose/buildQuery');
const localizationPlugin = require('../localization/plugin');
const buildSchema = require('../mongoose/schema/buildSchema');

const buildCollectionSchema = (collection, config, schemaOptions = {}) => {
  const schema = buildSchema(collection.fields, config, { timestamps: collection.timestamps, ...schemaOptions });

  schema.plugin(paginate)
    .plugin(buildQueryPlugin)
    .plugin(localizationPlugin, config.localization)
    .plugin(autopopulate);

  return schema;
};

module.exports = buildCollectionSchema;
