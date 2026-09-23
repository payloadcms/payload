import type { Connection, Schema } from 'mongoose'
import type { SchemaBuildContext } from 'payload/internal'

import { createSchemaBuildContext } from 'payload/internal'

import type { BuildSchemaOptions } from './buildSchema.js'

export type MongoSchemaBuildContext = SchemaBuildContext<Schema>

/**
 * Connection plugins can keep state on each nested schema. Mongoose does not clone those nested
 * schemas when it attaches a discriminator, so cached templates would change plugin application.
 */
export const createMongoSchemaBuildContext = ({
  connection,
}: {
  connection: Connection
}): MongoSchemaBuildContext =>
  createSchemaBuildContext<Schema>({ isCacheEnabled: connection.plugins.length === 0 })

export const getBlockSchemaVariantKey = ({
  buildSchemaOptions,
  isLocalized,
}: {
  buildSchemaOptions: BuildSchemaOptions
  isLocalized: boolean
}): string =>
  [
    `disableUnique:${buildSchemaOptions.disableUnique === true}`,
    `draftsEnabled:${buildSchemaOptions.draftsEnabled === true}`,
    `indexSortableFields:${buildSchemaOptions.indexSortableFields === true}`,
    `isLocalized:${isLocalized}`,
  ].join('|')
