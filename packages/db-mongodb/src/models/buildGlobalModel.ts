import mongoose from 'mongoose'

import type { MongooseAdapter } from '../index.js'
import type { GlobalModel } from '../types.js'
import type { MongoSchemaBuildContext } from './schemaBuildContext.js'

import { getBuildQueryPlugin } from '../queries/getBuildQueryPlugin.js'
import { buildSchema } from './buildSchema.js'

export const buildGlobalModel = ({
  adapter,
  schemaBuildContext,
}: {
  adapter: MongooseAdapter
  schemaBuildContext: MongoSchemaBuildContext
}): GlobalModel | null => {
  if (adapter.payload.config.globals && adapter.payload.config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema(
      {},
      { discriminatorKey: 'globalType', minimize: false, timestamps: true },
    )

    globalsSchema.plugin(getBuildQueryPlugin())

    const Globals = adapter.connection.model(
      'globals',
      globalsSchema,
      'globals',
    ) as unknown as GlobalModel
    const statusIndexPaths = new Set<string>()

    Object.values(adapter.payload.config.globals).forEach((globalConfig) => {
      const globalSchema = buildSchema({
        buildSchemaOptions: {
          options: {
            minimize: false,
          },
        },
        configFields: globalConfig.fields,
        payload: adapter.payload,
        schemaBuildContext,
        schemaPath: `global:${globalConfig.slug}`,
      })

      if (globalConfig.versions && globalConfig.versions.drafts) {
        for (const [fields, options] of globalSchema.indexes()) {
          const [statusPath] = Object.keys(fields)

          if (
            Object.keys(fields).length === 1 &&
            statusPath &&
            (statusPath === '_status' || statusPath.startsWith('_status.')) &&
            fields[statusPath] === 1 &&
            !options.unique &&
            !options.sparse &&
            !options.partialFilterExpression
          ) {
            const statusField = globalSchema.path(statusPath)

            if (statusField) {
              statusField.index(false)
              statusIndexPaths.add(statusPath)
            }
          }
        }
      }

      Globals.discriminator(globalConfig.slug, globalSchema)
    })

    // Add shared indexes after compiling discriminators so they do not inherit
    // global-specific partial filters for these collection-wide definitions.
    for (const statusPath of statusIndexPaths) {
      globalsSchema.index({ globalType: 1, [statusPath]: 1 })
    }

    return Globals
  }

  return null
}
