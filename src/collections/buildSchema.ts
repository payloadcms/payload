import paginate from 'mongoose-paginate-v2';
import buildQueryPlugin from '../mongoose/buildQuery';
import buildSchema from '../mongoose/buildSchema';

const buildCollectionSchema = (collection, config, schemaOptions = {}) => {
  const schema = buildSchema(config, collection.fields, { timestamps: collection.timestamps !== false, ...schemaOptions });

  schema.plugin(paginate)
    .plugin(buildQueryPlugin);

  return schema;
};

export default buildCollectionSchema;
