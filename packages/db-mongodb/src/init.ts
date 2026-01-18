import type { PaginateOptions } from 'mongoose'
import type { Init, SanitizedCollectionConfig } from '@ruya.sa/payload'

import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import {
  buildVersionCollectionFields,
  buildVersionCompoundIndexes,
  buildVersionGlobalFields,
} from '@ruya.sa/payload'

import type { MongooseAdapter } from './index.js'
import type { CollectionModel, GlobalModel } from './types.js'

import { buildCollectionSchema } from './models/buildCollectionSchema.js'
import { buildGlobalModel } from './models/buildGlobalModel.js'
import { buildSchema } from './models/buildSchema.js'
import { getBuildQueryPlugin } from './queries/getBuildQueryPlugin.js'
import { getDBName } from './utilities/getDBName.js'

export const init: Init = async function init(this: MongooseAdapter) {
  // Always create a scoped, **unopened** connection object
  // (no URI here; models compile per-connection and do not require an open socket)
  this.connection ??= mongoose.createConnection()

  if (this.afterCreateConnection) {
    await this.afterCreateConnection(this)
  }

  this.payload.config.collections.forEach((collection: SanitizedCollectionConfig) => {
    const schemaOptions = this.collectionsSchemaOptions?.[collection.slug]

    const schema = buildCollectionSchema(collection, this.payload, schemaOptions)
    if (collection.versions) {
      const versionModelName = getDBName({ config: collection, versions: true })

      const versionCollectionFields = buildVersionCollectionFields(this.payload.config, collection)

      const versionSchema = buildSchema({
        buildSchemaOptions: {
          disableUnique: true,
          draftsEnabled: true,
          indexSortableFields: this.payload.config.indexSortableFields,
          options: {
            minimize: false,
            timestamps: false,
            ...schemaOptions,
          },
        },
        compoundIndexes: buildVersionCompoundIndexes({ indexes: collection.sanitizedIndexes }),
        configFields: versionCollectionFields,
        payload: this.payload,
      })

      versionSchema.plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true }).plugin(
        getBuildQueryPlugin({
          collectionSlug: collection.slug,
          versionsFields: buildVersionCollectionFields(this.payload.config, collection, true),
        }),
      )

      const versionCollectionName =
        this.autoPluralization === true && !collection.dbName ? undefined : versionModelName

      this.versions[collection.slug] = this.connection.model(
        versionModelName,
        versionSchema,
        versionCollectionName,
      ) as unknown as CollectionModel
    }

    const modelName = getDBName({ config: collection })
    const collectionName =
      this.autoPluralization === true && !collection.dbName ? undefined : modelName

    this.collections[collection.slug] = this.connection.model<any>(
      modelName,
      schema,
      collectionName,
    ) as CollectionModel
  })

  this.globals = buildGlobalModel(this) as GlobalModel

  this.payload.config.globals.forEach((global) => {
    if (global.versions) {
      const versionModelName = getDBName({ config: global, versions: true })

      const versionGlobalFields = buildVersionGlobalFields(this.payload.config, global)

      const versionSchema = buildSchema({
        buildSchemaOptions: {
          disableUnique: true,
          draftsEnabled: true,
          indexSortableFields: this.payload.config.indexSortableFields,
          options: {
            minimize: false,
            timestamps: false,
          },
        },
        configFields: versionGlobalFields,
        payload: this.payload,
      })

      versionSchema.plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true }).plugin(
        getBuildQueryPlugin({
          versionsFields: buildVersionGlobalFields(this.payload.config, global, true),
        }),
      )

      this.versions[global.slug] = this.connection.model<any>(
        versionModelName,
        versionSchema,
        versionModelName,
      ) as CollectionModel
    }
  })
}
