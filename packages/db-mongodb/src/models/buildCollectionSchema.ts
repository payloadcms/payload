import type { PaginateOptions, Schema } from 'mongoose'
import type { SanitizedCollectionConfig } from 'payload'

import paginate from 'mongoose-paginate-v2'

import type { MongooseAdapter } from '../index.js'

import getBuildQueryPlugin from '../queries/buildQuery.js'
import buildSchema from './buildSchema.js'

const buildCollectionSchema = (
  collection: SanitizedCollectionConfig,
  adapter: MongooseAdapter,
): Schema => {
  const schema = buildSchema(adapter, collection.fields, {
    draftsEnabled: Boolean(typeof collection?.versions === 'object' && collection.versions.drafts),
    indexSortableFields: adapter.payload.config.indexSortableFields,
    options: {
      minimize: false,
      timestamps: collection.timestamps !== false,
      ...adapter.schemaOptions,
      ...(adapter.collectionOptions[collection.slug]?.schemaOptions || {}),
    },
  })

  if (adapter.payload.config.indexSortableFields && collection.timestamps !== false) {
    schema.index({ updatedAt: 1 })
    schema.index({ createdAt: 1 })
  }

  schema
    .plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
    .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug }))

  return schema
}

export default buildCollectionSchema
