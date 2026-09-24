import type { Connection, Schema } from 'mongoose'
import type { SchemaBuildContext } from 'payload/internal'

import mongoose from 'mongoose'
import { createSchemaBuildContext } from 'payload/internal'

import type { BuildSchemaOptions } from './buildSchema.js'

export type MongoSchemaBuildContext = SchemaBuildContext<Schema>

type MongoosePluginRegistry = Array<[Parameters<typeof mongoose.plugin>[0], unknown]>

const getMongoosePluginRegistry = ({
  mongooseInstance,
}: {
  mongooseInstance: typeof mongoose
}): MongoosePluginRegistry =>
  (mongooseInstance as { plugins: MongoosePluginRegistry } & typeof mongoose).plugins

const defaultMongoosePluginFunctions = new Set(
  getMongoosePluginRegistry({
    mongooseInstance: new mongoose.Mongoose({ createInitialConnection: false }),
  }).map(([plugin]) => plugin),
)

/**
 * Connection and global plugins can keep state on each nested schema. Mongoose does not clone
 * those nested schemas when it attaches a discriminator, so cached templates would change plugin
 * application.
 */
export const createMongoSchemaBuildContext = ({
  connection,
}: {
  connection: Connection
}): MongoSchemaBuildContext => {
  const hasCustomGlobalPlugins = getMongoosePluginRegistry({
    mongooseInstance: connection.base,
  }).some(([plugin]) => !defaultMongoosePluginFunctions.has(plugin))

  return createSchemaBuildContext<Schema>({
    isCacheEnabled: connection.plugins.length === 0 && !hasCustomGlobalPlugins,
  })
}

export const getBlockSchemaCacheKey = ({
  blockSlug,
  buildSchemaOptions,
  fieldPath,
  isLocalized,
  isReference,
  isVersion,
}: {
  blockSlug: string
  buildSchemaOptions: BuildSchemaOptions
  fieldPath: string
  isLocalized: boolean
  isReference: boolean
  isVersion: boolean
}): string =>
  [
    `${isReference ? `block:${blockSlug}` : `inline:${fieldPath}/block:${blockSlug}`}${isVersion ? '-version' : ''}`,
    buildSchemaOptions.disableUnique && 'disableUnique:true',
    buildSchemaOptions.draftsEnabled && 'draftsEnabled:true',
    buildSchemaOptions.indexSortableFields && 'indexSortableFields:true',
    isLocalized && 'isLocalized:true',
  ]
    .filter(Boolean)
    .join('|')
