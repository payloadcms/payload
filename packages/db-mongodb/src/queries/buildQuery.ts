import type { PipelineStage } from 'mongoose'
import type { Field, Payload, Where } from 'payload'

import { QueryError } from 'payload'

import { parseParams } from './parseParams.js'

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: Field[]
}

export type BuildQueryArgs = {
  globalSlug?: string
  locale?: string
  payload: Payload
  pipeline: PipelineStage[]
  projection?: Record<string, boolean>
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
    function buildQuery({
      globalSlug,
      locale,
      payload,
      pipeline,
      projection,
      where,
    }: BuildQueryArgs): Record<string, unknown> {
      let fields = versionsFields
      if (!fields) {
        if (globalSlug) {
          const globalConfig = payload.globals.config.find(({ slug }) => slug === globalSlug)
          fields = globalConfig.fields
        }
        if (collectionSlug) {
          const collectionConfig = payload.collections[collectionSlug].config
          fields = collectionConfig.fields
        }
      }
      const errors = []
      const result = parseParams({
        collectionSlug,
        fields,
        globalSlug,
        locale,
        payload,
        pipeline,
        projection,
        where,
      })

      if (errors.length > 0) {
        throw new QueryError(errors)
      }

      return result
    }
    modifiedSchema.statics.buildQuery = buildQuery
  }
}
