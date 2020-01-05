import mongooseHidden from 'mongoose-hidden';
import paginate from 'mongoose-paginate-v2';
import autopopulate from 'mongoose-autopopulate';
import buildQueryPlugin from '../mongoose/buildQuery';
import localizationPlugin from '../localization/plugin';
import buildSchema from '../mongoose/schema/buildSchema';

const buildCollectionSchema = (collection, config, schemaOptions = {}) => {
  const schema = buildSchema(collection.fields, config, { timestamps: collection.timestamps, ...schemaOptions });

  schema.plugin(paginate)
    .plugin(buildQueryPlugin)
    .plugin(localizationPlugin, config.localization)
    .plugin(autopopulate)
    .plugin(mongooseHidden());

  return schema;
};

export default buildCollectionSchema;
