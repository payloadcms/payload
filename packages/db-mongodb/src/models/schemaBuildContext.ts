import type { Schema } from 'mongoose'
import type { SchemaBuildContext } from 'payload/internal'

import type { BuildSchemaOptions } from './buildSchema.js'

export type MongoSchemaBuildContext = SchemaBuildContext<Schema>

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
