import type { PaginateOptions, Schema } from 'mongoose'
import type { SanitizedCollectionConfig, SanitizedConfig } from 'payload'

import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

import { getBuildQueryPlugin } from '../queries/buildQuery.js'
import { buildSchema } from './buildSchema.js'

export const buildCollectionSchema = (
  collection: SanitizedCollectionConfig,
  config: SanitizedConfig,
  schemaOptions = {},
): Schema => {
  const schema = buildSchema(config, collection.fields, {
    draftsEnabled: Boolean(typeof collection?.versions === 'object' && collection.versions.drafts),
    indexSortableFields: config.indexSortableFields,
    options: {
      minimize: false,
      timestamps: collection.timestamps !== false,
      ...schemaOptions,
    },
  })

  if (Array.isArray(collection.upload.filenameCompoundIndex)) {
    const indexDefinition: Record<string, 1> = collection.upload.filenameCompoundIndex.reduce(
      (acc, index) => {
        acc[index] = 1
        return acc
      },
      {},
    )

    schema.index(indexDefinition, { unique: true })
  }

  if (config.indexSortableFields && collection.timestamps !== false) {
    schema.index({ updatedAt: 1 })
    schema.index({ createdAt: 1 })
  }

  schema
    .plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
    .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug }))

  if (Object.keys(collection.joins).length > 0) {
    schema.plugin(mongooseAggregatePaginate)
  }

  return schema
}
