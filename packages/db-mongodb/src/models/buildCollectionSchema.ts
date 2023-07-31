import paginate from 'mongoose-paginate-v2';
import { PaginateOptions, Schema } from 'mongoose';
import { SanitizedConfig } from 'payload/dist/config/types';
import { SanitizedCollectionConfig } from 'payload/dist/collections/config/types';
import getBuildQueryPlugin from '../queries/buildQuery';
import buildSchema from './buildSchema';

const buildCollectionSchema = (collection: SanitizedCollectionConfig, config: SanitizedConfig, schemaOptions = {}): Schema => {
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
  if (collection.indexes) {
    collection.indexes.forEach((index) => {
      schema.index(index.fields, index.options);
    });
  }
  schema.plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
    .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug }));

  return schema;
};

export default buildCollectionSchema;
