/* eslint-disable no-param-reassign */
import mongoose, { PaginateOptions } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { buildVersionCollectionFields } from '@alessiogr/payloadtest/versions';
import { SanitizedCollectionConfig } from '@alessiogr/payloadtest/types';
import { getVersionsModelName } from '@alessiogr/payloadtest/versions';
import { buildVersionGlobalFields } from '@alessiogr/payloadtest/versions';
import type { Init } from '@alessiogr/payloadtest/database';
import getBuildQueryPlugin from './queries/buildQuery.js';
import buildCollectionSchema from './models/buildCollectionSchema.js';
import buildSchema from './models/buildSchema.js';
import type { MongooseAdapter } from '.';
import { buildGlobalModel } from './models/buildGlobalModel.js';
import { CollectionModel } from './types.js';

export const init: Init = async function init(
  this: MongooseAdapter,
) {
  this.payload.config.collections.forEach(
    (collection: SanitizedCollectionConfig) => {
      const schema = buildCollectionSchema(collection, this.payload.config);

      if (collection.versions) {
        const versionModelName = getVersionsModelName(collection);

        const versionCollectionFields = buildVersionCollectionFields(collection);

        const versionSchema = buildSchema(
          this.payload.config,
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

        versionSchema.plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
          .plugin(
            getBuildQueryPlugin({
              collectionSlug: collection.slug,
              versionsFields: versionCollectionFields,
            }),
          );

        if (collection.versions?.drafts) {
          versionSchema.plugin(mongooseAggregatePaginate);
        }

        const model = mongoose.model(
          versionModelName,
          versionSchema,
          versionModelName,
        ) as CollectionModel;
        // this.payload.versions[collection.slug] = model;
        this.versions[collection.slug] = model;
      }

      const model = mongoose.model(
        collection.slug,
        schema,
        this.autoPluralization === true ? undefined : collection.slug,
      ) as CollectionModel;
      this.collections[collection.slug] = model;

      // TS expect error only needed until we launch 2.0.0
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      this.payload.collections[collection.slug] = {
        config: collection,
      };
    },
  );

  const model = buildGlobalModel(this.payload.config);
  this.globals = model;

  this.payload.config.globals.forEach((global) => {
    if (global.versions) {
      const versionModelName = getVersionsModelName(global);

      const versionGlobalFields = buildVersionGlobalFields(global);

      const versionSchema = buildSchema(
        this.payload.config,
        versionGlobalFields,
        {
          indexSortableFields: this.payload.config.indexSortableFields,
          disableUnique: true,
          draftsEnabled: true,
          options: {
            timestamps: false,
            minimize: false,
          },
        },
      );

      versionSchema
        .plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
        .plugin(getBuildQueryPlugin({ versionsFields: versionGlobalFields }));

      const versionsModel = mongoose.model(
        versionModelName,
        versionSchema,
        versionModelName,
      ) as CollectionModel;
      this.versions[global.slug] = versionsModel;
    }
  });
};
