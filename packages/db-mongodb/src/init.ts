import type { PaginateOptions } from 'mongoose'
import type { Init, SanitizedCollectionConfig } from 'payload'

import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import { buildVersionCollectionFields, buildVersionGlobalFields } from 'payload'

import type { MongooseAdapter } from './index.js'
import type { CollectionModel } from './types.js'

import buildCollectionSchema from './models/buildCollectionSchema.js'
import { buildGlobalModel } from './models/buildGlobalModel.js'
import buildSchema from './models/buildSchema.js'
import getBuildQueryPlugin from './queries/buildQuery.js'
import { getDBName } from './utilities/getDBName.js'

export const init: Init = function init(this: MongooseAdapter) {
  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const schema = buildCollectionSchema(collection, this)

    if (collection.versions) {
      const versionModelName = getDBName({ config: collection, versions: true })

      const versionCollectionFields = buildVersionCollectionFields(collection)

      const versionSchema = buildSchema(this, versionCollectionFields, {
        disableUnique: true,
        draftsEnabled: true,
        indexSortableFields: this.payload.config.indexSortableFields,
        options: {
          minimize: false,
          timestamps: false,
          ...this.schemaOptions,
          ...(this.collectionOptions[collection.slug]?.schemaOptions || {}),
        },
      })

      versionSchema.plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true }).plugin(
        getBuildQueryPlugin({
          collectionSlug: collection.slug,
          versionsFields: versionCollectionFields,
        }),
      )

      const model = mongoose.model(
        versionModelName,
        versionSchema,
        this.autoPluralization === true ? undefined : versionModelName,
      ) as CollectionModel
      // this.payload.versions[collection.slug] = model;
      this.versions[collection.slug] = model
    }

    const model = mongoose.model(
      getDBName({ config: collection }),
      schema,
      this.autoPluralization === true ? undefined : collection.slug,
    ) as CollectionModel
    this.collections[collection.slug] = model
  })

  const model = buildGlobalModel(this)
  this.globals = model

  this.payload.config.globals.forEach((global) => {
    if (global.versions) {
      const versionModelName = getDBName({ config: global, versions: true })

      const versionGlobalFields = buildVersionGlobalFields(global)

      const versionSchema = buildSchema(this, versionGlobalFields, {
        disableUnique: true,
        draftsEnabled: true,
        indexSortableFields: this.payload.config.indexSortableFields,
        options: {
          minimize: false,
          timestamps: false,
          ...this.schemaOptions,
          ...(this.globalsOptions.schemaOptions || {}),
        },
      })

      versionSchema
        .plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
        .plugin(getBuildQueryPlugin({ versionsFields: versionGlobalFields }))

      const versionsModel = mongoose.model(
        versionModelName,
        versionSchema,
        versionModelName,
      ) as CollectionModel
      this.versions[global.slug] = versionsModel
    }
  })
}
