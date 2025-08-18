import type { FlattenedField, Payload, Where } from 'payload'

import { APIError } from 'payload'

import { parseParams } from './parseParams.js'

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: FlattenedField[]
}

export type BuildQueryArgs = {
  globalSlug?: string
  locale?: string
  payload: Payload
  where: Where
}

// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
// Deprecated in favor of using simpler buildQuery directly
export const getBuildQueryPlugin = ({
  collectionSlug,
  versionsFields,
}: GetBuildQueryPluginArgs = {}) => {
  return function buildQueryPlugin(schema: any) {
    const modifiedSchema = schema
    async function schemaBuildQuery({
      globalSlug,
      locale,
      payload,
      where,
    }: BuildQueryArgs): Promise<Record<string, unknown>> {
      let fields: FlattenedField[] | null = null

      if (versionsFields) {
        fields = versionsFields
      } else {
        if (globalSlug) {
          const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)

          if (!globalConfig) {
            throw new APIError(`Global with the slug ${globalSlug} was not found`)
          }

          fields = globalConfig.flattenedFields
        }
        if (collectionSlug) {
          const collectionConfig = payload.collections[collectionSlug]?.config

          if (!collectionConfig) {
            throw new APIError(`Collection with the slug ${globalSlug} was not found`)
          }

          fields = collectionConfig.flattenedFields
        }
      }

      if (fields === null) {
        throw new APIError('Fields are not initialized.')
      }

      const result = await parseParams({
        collectionSlug,
        fields,
        globalSlug,
        locale,
        parentIsLocalized: false,
        payload,
        where,
      })

      return result
    }
    modifiedSchema.statics.buildQuery = schemaBuildQuery
  }
}
