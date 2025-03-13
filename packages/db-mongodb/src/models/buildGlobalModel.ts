import type { Payload } from 'payload'

import mongoose from 'mongoose'

import type { GlobalModel } from '../types.js'

import { getBuildQueryPlugin } from '../queries/getBuildQueryPlugin.js'
import { buildSchema } from './buildSchema.js'

export const buildGlobalModel = (payload: Payload): GlobalModel | null => {
  if (payload.config.globals && payload.config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema(
      {},
      { discriminatorKey: 'globalType', minimize: false, timestamps: true },
    )

    globalsSchema.plugin(getBuildQueryPlugin())

    const Globals = mongoose.model('globals', globalsSchema, 'globals') as unknown as GlobalModel

    Object.values(payload.config.globals).forEach((globalConfig) => {
      const globalSchema = buildSchema({
        buildSchemaOptions: {
          options: {
            minimize: false,
          },
        },
        configFields: globalConfig.fields,
        payload,
      })
      Globals.discriminator(globalConfig.slug, globalSchema)
    })

    return Globals
  }

  return null
}
