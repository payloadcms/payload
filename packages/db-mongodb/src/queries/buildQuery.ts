import type { ClientSession } from 'mongodb'
import type { FlattenedField, Payload, Where } from 'payload'

import { parseParams } from './parseParams.js'

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: FlattenedField[]
}

export type BuildQueryArgs = {
  globalSlug?: string
  locale?: string
  payload: Payload
  session?: ClientSession
  where: Where
}

// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
export const getBuildQueryPlugin = ({
  collectionSlug,
  versionsFields,
}: GetBuildQueryPluginArgs = {}) => {
  return function buildQueryPlugin(schema) {
    const modifiedSchema = schema
    async function buildQuery({
      globalSlug,
      locale,
      payload,
      session,
      where,
    }: BuildQueryArgs): Promise<Record<string, unknown>> {
      let fields = versionsFields
      if (!fields) {
        if (globalSlug) {
          const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)
          fields = globalConfig.flattenedFields
        }
        if (collectionSlug) {
          const collectionConfig = payload.collections[collectionSlug].config
          fields = collectionConfig.flattenedFields
        }
      }

      const result = await parseParams({
        collectionSlug,
        fields,
        globalSlug,
        locale,
        payload,
        session,
        where,
      })

      return result
    }
    modifiedSchema.statics.buildQuery = buildQuery
  }
}
