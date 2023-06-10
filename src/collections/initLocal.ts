import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { buildVersionCollectionFields } from '../versions/buildCollectionFields';
import getBuildQueryPlugin from '../mongoose/buildQuery';
import buildCollectionSchema from './buildSchema';
import buildSchema from '../mongoose/buildSchema';
import { CollectionModel, SanitizedCollectionConfig } from './config/types';
import { Payload } from '../payload';
import { getVersionsModelName } from '../versions/getVersionsModelName';

export default function initCollectionsLocal(ctx: Payload): void {
  ctx.config.collections = ctx.config.collections.map((collection: SanitizedCollectionConfig) => {
    const formattedCollection = collection;

    const schema = buildCollectionSchema(formattedCollection, ctx.config);

    if (collection.versions) {
      const versionModelName = getVersionsModelName(collection);

      const versionCollectionFields = buildVersionCollectionFields(collection);

      const versionSchema = buildSchema(
        ctx.config,
        versionCollectionFields,
        {
          disableUnique: true,
          draftsEnabled: true,
          options: {
            timestamps: false,
            minimize: false,
          },
        },
      );

      if (collection.indexes) {
        collection.indexes.forEach((index) => {
          // prefix 'version.' to each field in the index
          const versionIndex = { fields: {}, options: index.options };
          Object.entries(index.fields).forEach(([key, value]) => {
            versionIndex.fields[`version.${key}`] = value;
          });
          versionSchema.index(versionIndex.fields, versionIndex.options);
        });
      }

      versionSchema.plugin(paginate, { useEstimatedCount: true })
        .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug, versionsFields: versionCollectionFields }));

      if (collection.versions?.drafts) {
        versionSchema.plugin(mongooseAggregatePaginate);
      }

      ctx.versions[collection.slug] = mongoose.model(versionModelName, versionSchema) as CollectionModel;
    }


    ctx.collections[formattedCollection.slug] = {
      Model: mongoose.model(formattedCollection.slug, schema) as CollectionModel,
      config: formattedCollection,
    };

    return formattedCollection;
  });
}
