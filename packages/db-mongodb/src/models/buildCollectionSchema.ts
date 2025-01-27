import type { PaginateOptions, Schema } from 'mongoose'
import type { SanitizedCollectionConfig } from 'payload/types'

import paginate from 'mongoose-paginate-v2'

import type { MongooseAdapter } from '..'

import getBuildQueryPlugin from '../queries/buildQuery'
import buildSchema from './buildSchema'

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
