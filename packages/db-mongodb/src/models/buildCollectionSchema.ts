import type { PaginateOptions, Schema, SchemaOptions } from 'mongoose'
import type { Payload, SanitizedCollectionConfig } from 'payload'

import paginate from 'mongoose-paginate-v2'

import type { MongoSchemaBuildContext } from './schemaBuildContext.js'

import { getBuildQueryPlugin } from '../queries/getBuildQueryPlugin.js'
import { buildSchema } from './buildSchema.js'

export const buildCollectionSchema = ({
  collection,
  payload,
  schemaBuildContext,
  schemaOptions = {},
}: {
  collection: SanitizedCollectionConfig
  payload: Payload
  schemaBuildContext: MongoSchemaBuildContext
  schemaOptions?: SchemaOptions
}): Schema => {
  const schema = buildSchema({
    buildSchemaOptions: {
      draftsEnabled: Boolean(
        typeof collection?.versions === 'object' && collection.versions.drafts,
      ),
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
    schemaBuildContext,
    schemaPath: `collection:${collection.slug}`,
  })

  const identity = collection.custom?.branchIdentityStorage
  const parent = identity?.parentCollection
  if (
    parent &&
    payload.collections[parent]?.config.custom?.branchStorage?.identities === collection.slug
  ) {
    // Identity coordinates stay binary even when document queries use linguistic collation.
    schema.removeIndex({ parent: 1 })
    schema.index({ parent: 1 }, { collation: { locale: 'simple' }, unique: true })
    const collation = payload.db.collation
    if (collation) {
      const locales = payload.config.localization ? payload.config.localization.localeCodes : ['en']
      for (const locale of locales) {
        schema.index(
          { parent: 1 },
          {
            name: `branch_identity_parent_${locale}`,
            collation: { locale, ...collation },
          },
        )
      }
    }
  }

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
