/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { buildVersionCollectionFields } from '../versions/buildCollectionFields';
import getBuildQueryPlugin from './queries/buildQuery';
import buildCollectionSchema from './models/buildCollectionSchema';
import buildSchema from './models/buildSchema';
import { CollectionModel, SanitizedCollectionConfig } from '../collections/config/types';
import { getVersionsModelName } from '../versions/getVersionsModelName';
import type { Payload } from '..';
import type { MongooseAdapter } from '.';
import { buildGlobalModel } from './models/buildGlobalModel';
import { buildVersionGlobalFields } from '../versions/buildGlobalFields';

export async function init(
  this: MongooseAdapter,
  { payload }: { payload: Payload },
): Promise<void> {
  payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const schema = buildCollectionSchema(collection, payload.config);

    if (collection.versions) {
      const versionModelName = getVersionsModelName(collection);

      const versionCollectionFields = buildVersionCollectionFields(collection);

      const versionSchema = buildSchema(
        payload.config,
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
          const versionIndex = {
            fields: {},
            options: index.options,
          };
          Object.entries(index.fields)
            .forEach(([key, value]) => {
              versionIndex.fields[`version.${key}`] = value;
            });
          versionSchema.index(versionIndex.fields, versionIndex.options);
        });
      }

      versionSchema.plugin(paginate, { useEstimatedCount: true })
        .plugin(getBuildQueryPlugin({
          collectionSlug: collection.slug,
          versionsFields: versionCollectionFields,
        }));

      if (collection.versions?.drafts) {
        versionSchema.plugin(mongooseAggregatePaginate);
      }

      const model = mongoose.model(versionModelName, versionSchema) as CollectionModel;
      payload.versions[collection.slug] = model;
      this.versions[collection.slug] = model;
    }

    const model = mongoose.model(collection.slug, schema) as CollectionModel;
    this.collections[collection.slug] = model;

    payload.collections[collection.slug] = {
      Model: model,
      config: collection,
    };
  });

  const model = buildGlobalModel(payload.config);
  this.globals = model;

  payload.globals.Model = model;

  payload.config.globals.forEach((global) => {
    if (global.versions) {
      const versionModelName = getVersionsModelName(global);

      const versionGlobalFields = buildVersionGlobalFields(global);

      const versionSchema = buildSchema(
        payload.config,
        versionGlobalFields,
        {
          indexSortableFields: payload.config.indexSortableFields,
          disableUnique: true,
          draftsEnabled: true,
          options: {
            timestamps: false,
            minimize: false,
          },
        },
      );

      versionSchema.plugin(paginate, { useEstimatedCount: true })
        .plugin(getBuildQueryPlugin({ versionsFields: versionGlobalFields }));

      const versionsModel = mongoose.model(versionModelName, versionSchema) as CollectionModel;
      this.versions[global.slug] = versionsModel;

      payload.versions[global.slug] = versionsModel;
    }
  });
}
