import type { PaginateOptions } from 'mongoose'
import type { Init, SanitizedCollectionConfig } from 'payload'

import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'

import type { MongooseAdapter } from './index.js'
import type { CollectionModel } from './types.js'

import { buildCollectionSchema } from './models/buildCollectionSchema.js'
import { buildGlobalModel } from './models/buildGlobalModel.js'
import { buildSchema } from './models/buildSchema.js'
import { getBuildQueryPlugin } from './queries/buildQuery.js'
import { getDBName } from './utilities/getDBName.js'

export const init: Init = function init(this: MongooseAdapter) {
  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const schema = buildCollectionSchema(collection, this.payload)

    if (collection.versions) {
      const versionModelName = getDBName({ config: collection, versions: true })

      const versionCollectionFields = buildVersionCollectionFields(this.payload.config, collection)

      const versionSchema = buildSchema(this.payload, versionCollectionFields, {
        disableUnique: true,
        draftsEnabled: true,
        indexSortableFields: this.payload.config.indexSortableFields,
        options: {
          minimize: false,
          timestamps: false,
        },
      })

      versionSchema.plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true }).plugin(
        getBuildQueryPlugin({
          collectionSlug: collection.slug,
          versionsFields: buildVersionCollectionFields(this.payload.config, collection, true),
        }),
      )

      versionSchema.plugin(mongooseAggregatePaginate)

      const versionCollectionName =
        this.autoPluralization === true && !collection.dbName ? undefined : versionModelName

      this.versions[collection.slug] = mongoose.model(
        versionModelName,
        versionSchema,
        versionCollectionName,
      ) as CollectionModel
    }

    const modelName = getDBName({ config: collection })
    const collectionName =
      this.autoPluralization === true && !collection.dbName ? undefined : modelName

    this.collections[collection.slug] = mongoose.model(
      modelName,
      schema,
      collectionName,
    ) as CollectionModel
  })

  this.globals = buildGlobalModel(this.payload)

  this.payload.config.globals.forEach((global) => {
    if (global.versions) {
      const versionModelName = getDBName({ config: global, versions: true })

      const versionGlobalFields = buildVersionGlobalFields(this.payload.config, global)

      const versionSchema = buildSchema(this.payload, versionGlobalFields, {
        disableUnique: true,
        draftsEnabled: true,
        indexSortableFields: this.payload.config.indexSortableFields,
        options: {
          minimize: false,
          timestamps: false,
        },
      })

      versionSchema.plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true }).plugin(
        getBuildQueryPlugin({
          versionsFields: buildVersionGlobalFields(this.payload.config, global, true),
        }),
      )

      this.versions[global.slug] = mongoose.model(
        versionModelName,
        versionSchema,
        versionModelName,
      ) as CollectionModel
    }
  })
}
