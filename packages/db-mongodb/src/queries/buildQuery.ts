import type { ClientSession, PipelineStage } from 'mongoose'
import type { FlattenedField, Payload, Where } from 'payload'

import { QueryError } from 'payload'

import type { CollectionModel, GlobalModel } from '../types.js'

import { parseParams } from './parseParams.js'

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: FlattenedField[]
}

export type BuildQueryArgs = {
  globalSlug?: string
  locale?: string
  payload: Payload
  pipeline?: PipelineStage[]
  projection?: Record<string, boolean>
  session?: ClientSession
  where: Where
}

// This plugin asynchronously builds a list of Mongoose query constraints
// which can then be used in subsequent Mongoose queries.
// You can pass 'pipeline' to Model.buildQuery if you plan to use .aggregate() after
export const getBuildQueryPlugin = ({
  collectionSlug,
  versionsFields,
}: GetBuildQueryPluginArgs = {}) => {
  return function buildQueryPlugin(schema) {
    const modifiedSchema = schema
    async function buildQuery(
      this: CollectionModel | GlobalModel,
      { globalSlug, locale, payload, pipeline, projection, session, where }: BuildQueryArgs,
    ): Promise<Record<string, unknown>> {
      if (!pipeline) {
        const pipeline: PipelineStage[] = []

        const query = await this.buildQuery({
          globalSlug,
          locale,
          payload,
          pipeline,
          projection,
          where,
        })

        // If there weren't any additional pipeline stages, keep this query.
        if (!pipeline.length) {
          return query
        }

        pipeline.push({
          $match: query,
        })

        pipeline.push({ $project: { _id: true } })

        const result = await this.aggregate(pipeline, { session })

        return {
          _id: {
            $in: result.map((each) => each._id),
          },
        }
      }

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
