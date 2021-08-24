import paginate from 'mongoose-paginate-v2';
import { Schema } from 'mongoose';
import { SanitizedConfig } from '../../config';
import buildQueryPlugin from '../mongoose/buildQuery';
import buildSchema from '../mongoose/buildSchema';
import { SanitizedCollectionConfig } from './config/types';

const buildCollectionSchema = (collection: SanitizedCollectionConfig, config: SanitizedConfig, schemaOptions = {}): Schema => {
  const schema = buildSchema(
    config,
    collection.fields,
    { timestamps: collection.timestamps !== false, ...schemaOptions },
  );

  schema.plugin(paginate, { useEstimatedCount: true })
    .plugin(buildQueryPlugin);

  return schema;
};

export default buildCollectionSchema;
