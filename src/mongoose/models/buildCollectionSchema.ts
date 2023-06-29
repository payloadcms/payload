import paginate from 'mongoose-paginate-v2';
import { Schema } from 'mongoose';
import getBuildQueryPlugin from '../queries/buildQuery';
import buildSchema from './buildSchema';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import type { SanitizedPayloadMongooseConfig } from '..';

const buildCollectionSchema = (collection: SanitizedCollectionConfig, config: SanitizedPayloadMongooseConfig, schemaOptions = {}): Schema => {
  const schema = buildSchema(
    config,
    collection.fields,
    {
      draftsEnabled: Boolean(typeof collection?.versions === 'object' && collection.versions.drafts),
      options: {
        timestamps: collection.timestamps !== false,
        minimize: false,
        ...schemaOptions,
      },
      indexSortableFields: config.indexSortableFields,
    },
  );

  if (config.indexSortableFields && collection.timestamps !== false) {
    schema.index({ updatedAt: 1 });
    schema.index({ createdAt: 1 });
  }
  if (config.db.collections) {
    const configCollection = config.db.collections[collection.slug];

    if (configCollection.indexes) {
      configCollection.indexes.forEach((index) => {
        schema.index(index.fields, index.options);
      });
    }
  }
  schema.plugin(paginate, { useEstimatedCount: true })
    .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug }));

  return schema;
};

export default buildCollectionSchema;
