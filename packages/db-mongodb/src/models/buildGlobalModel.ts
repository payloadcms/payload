import mongoose from 'mongoose'

import type { MongooseAdapter } from '..'
import type { GlobalModel } from '../types'

import getBuildQueryPlugin from '../queries/buildQuery'
import buildSchema from './buildSchema'

export const buildGlobalModel = (adapter: MongooseAdapter): GlobalModel | null => {
  if (adapter.payload.config.globals && adapter.payload.config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema(
      {},
      {
        discriminatorKey: 'globalType',
        minimize: false,
        ...adapter.schemaOptions,
        ...(adapter.globalsOptions.schemaOptions || {}),
        timestamps: true,
      },
    )

    globalsSchema.plugin(getBuildQueryPlugin())

    const Globals = mongoose.model('globals', globalsSchema, 'globals') as unknown as GlobalModel

    Object.values(adapter.payload.config.globals).forEach((globalConfig) => {
      const globalSchema = buildSchema(adapter, globalConfig.fields, {
        options: {
          minimize: false,
          ...adapter.schemaOptions,
          ...(adapter.globalsOptions.schemaOptions || {}),
        },
      })
      Globals.discriminator(globalConfig.slug, globalSchema)
    })

    return Globals
  }

  return null
}
