import type { PaginateOptions, Schema } from 'mongoose'
import type { Payload, SanitizedCollectionConfig } from 'payload'

import paginate from 'mongoose-paginate-v2'

import type { MongooseIDType } from './buildSchema.js'

import { getBuildQueryPlugin } from '../queries/getBuildQueryPlugin.js'
import { buildSchema } from './buildSchema.js'

export const buildCollectionSchema = (
  collection: SanitizedCollectionConfig,
  payload: Payload,
  schemaOptions = {},
  idType?: MongooseIDType,
): Schema => {
  const schema = buildSchema({
    buildSchemaOptions: {
      draftsEnabled: Boolean(
        typeof collection?.versions === 'object' && collection.versions.drafts,
      ),
      idType,
      indexSortableFields: payload.config.indexSortableFields,
      options: {
        minimize: false,
        timestamps: collection.timestamps !== false,
        ...schemaOptions,
      },
    },
    compoundIndexes: collection.sanitizedIndexes,
    configFields: collection.fields,
    flattenedFields: collection.flattenedFields,
    payload,
  })

  if (Array.isArray(collection.upload.filenameCompoundIndex)) {
    const indexDefinition = collection.upload.filenameCompoundIndex.reduce<Record<string, 1>>(
      (acc, index) => {
        acc[index] = 1
        return acc
      },
      {},
    )

    schema.index(indexDefinition, { unique: true })
  }

  schema
    .plugin<any, PaginateOptions>(paginate, { useEstimatedCount: true })
    .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug }))

  return schema
}
