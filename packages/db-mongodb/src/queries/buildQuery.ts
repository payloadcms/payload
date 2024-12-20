import type { ClientSession } from 'mongodb'
import type { PipelineStage } from 'mongoose'
import type { FlattenedField, Payload, Where } from 'payload'

import type { CollectionModel, GlobalModel } from '../types.js'

import { parseParams } from './parseParams.js'

type GetBuildQueryPluginArgs = {
  collectionSlug?: string
  versionsFields?: FlattenedField[]
}

export type BuildQueryArgs = {
  aggregation?: PipelineStage[]
  globalSlug?: string
  locale?: string
  payload: Payload
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
      { aggregation, globalSlug, locale, payload, projection, session, where }: BuildQueryArgs,
    ): Promise<Record<string, unknown>> {
      if (!aggregation) {
        aggregation = []

        const query = await this.buildQuery({
          aggregation,
          globalSlug,
          locale,
          payload,
          projection,
          where,
        })

        // If there weren't any additional pipeline stages (querying by relationship fields), keep this query.
        if (!aggregation.length) {
          return query
        }

        aggregation.push({
          $match: query,
        })

        aggregation.push({ $project: { _id: true } })

        const result = await this.collection.aggregate(aggregation, { session }).toArray()

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

      const result = parseParams({
        aggregation,
        collectionSlug,
        fields,
        globalSlug,
        locale,
        payload,
        projection,
        where,
      })

      return result
    }

    modifiedSchema.statics.buildQuery = buildQuery
  }
}
