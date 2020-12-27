import paginate from 'mongoose-paginate-v2';
import buildQueryPlugin from '../mongoose/buildQuery';
import localizationPlugin from '../localization/plugin';
import buildSchema from '../mongoose/buildSchema';

const buildCollectionSchema = (collection, config, schemaOptions = {}) => {
  const schema = buildSchema(collection.fields, { timestamps: collection.timestamps !== false, ...schemaOptions });

  schema.plugin(paginate)
    .plugin(buildQueryPlugin);

  if (config.localization) {
    schema.plugin(localizationPlugin, config.localization);
  }

  return schema;
};

export default buildCollectionSchema;
