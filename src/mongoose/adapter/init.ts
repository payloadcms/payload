/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields';
import getBuildQueryPlugin from '../buildQuery';
import buildCollectionSchema from './buildCollectionSchema';
import buildSchema from '../buildSchema';
import { CollectionModel, SanitizedCollectionConfig } from '../../collections/config/types';
import { getVersionsModelName } from '../../versions/getVersionsModelName';
import type { Payload } from '../..';
import type { MongooseAdapter } from '.';
import { buildGlobalModel } from './buildGlobalModel';
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields';

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

      payload.versions[collection.slug] = mongoose.model(versionModelName, versionSchema) as CollectionModel;
    }


    payload.collections[collection.slug] = {
      Model: mongoose.model(collection.slug, schema) as CollectionModel,
      config: collection,
    };
  });

  if (payload.config.globals) {
    payload.globals = {
      Model: buildGlobalModel(payload.config),
      config: payload.config.globals,
    };

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

        payload.versions[global.slug] = mongoose.model(versionModelName, versionSchema) as CollectionModel;
      }
    });
  }
}
