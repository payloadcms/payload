import type { PipelineStage } from 'mongoose'
import type { CollectionSlug, JoinQuery, SanitizedCollectionConfig, Where } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildSortParam } from '../queries/buildSortParam.js'

type BuildAggregationArgs = {
  adapter: MongooseAdapter
  collection?: CollectionSlug
  collectionConfig?: SanitizedCollectionConfig
  joins?: JoinQuery
  // the number of docs to get at the top collection level
  limit?: number
  locale: string
  pipeline: PipelineStage[]
  projection: Record<string, boolean>
  // the where clause for the top collection
  query?: Where
  /** whether the query is from drafts */
  versions?: boolean
}

export const buildAggregation = async ({
  adapter,
  collection,
  collectionConfig,
  joins,
  limit,
  locale,
  pipeline: incomingPipeline,
  projection,
  query,
  versions,
}: BuildAggregationArgs): Promise<PipelineStage[] | undefined> => {
  if (
    !incomingPipeline.length &&
    (Object.keys(collectionConfig?.joins ?? []).length === 0 || joins === false)
  ) {
    return
  }

  const aggregate: PipelineStage[] = [
    {
      $sort: { createdAt: -1 },
    },
  ]

  for (const stage of incomingPipeline) {
    aggregate.push(stage)
  }

  if (query) {
    aggregate.push({
      $match: query,
    })
  }

  if (limit) {
    aggregate.push({
      $limit: limit,
    })
  }

  if (collectionConfig && Object.keys(collectionConfig.joins).length !== 0 && joins !== false) {
    const joinConfig = adapter.payload.collections[collection].config.joins
    for (const slug of Object.keys(collectionConfig.joins)) {
      for (const join of joinConfig[slug]) {
        if (joins?.[join.joinPath] === false) {
          continue
        }

        const joinModel = adapter.collections[join.field.collection]

        const {
          limit: limitJoin = join.field.defaultLimit ?? 10,
          sort: sortJoin = join.field.defaultSort || collectionConfig.defaultSort,
          where: whereJoin,
        } = joins?.[join.joinPath] || {}

        const sort = buildSortParam({
          config: adapter.payload.config,
          fields: adapter.payload.collections[slug].config.flattenedFields,
          locale,
          sort: sortJoin || collectionConfig.defaultSort,
          timestamps: true,
        })
        const sortProperty = Object.keys(sort)[0]
        const sortDirection = sort[sortProperty] === 'asc' ? 1 : -1

        const joinPipeline: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = []
        const joinProjection: Record<string, boolean> = {}

        const $match = await joinModel.buildQuery({
          locale,
          payload: adapter.payload,
          pipeline: joinPipeline,
          projection: joinProjection,
          where: whereJoin,
        })

        const pipeline: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = [
          ...joinPipeline,
          { $match },
          {
            $sort: { [sortProperty]: sortDirection },
          },
        ]

        if (limitJoin > 0) {
          pipeline.push({
            $limit: limitJoin + 1,
          })
        }

        if (Object.keys(joinProjection).length) {
          pipeline.push({ $project: joinProjection })
        }

        if (adapter.payload.config.localization && locale === 'all') {
          adapter.payload.config.localization.localeCodes.forEach((code) => {
            const as = `${versions ? `version.${join.joinPath}` : join.joinPath}${code}`

            aggregate.push(
              {
                $lookup: {
                  as: `${as}.docs`,
                  foreignField: `${join.field.on}${code}`,
                  from: adapter.collections[slug].collection.name,
                  localField: versions ? 'parent' : '_id',
                  pipeline,
                },
              },
              {
                $addFields: {
                  [`${as}.docs`]: {
                    $map: {
                      as: 'doc',
                      in: '$$doc._id',
                      input: `$${as}.docs`,
                    },
                  }, // Slicing the docs to match the limit
                  [`${as}.hasNextPage`]: limitJoin
                    ? { $gt: [{ $size: `$${as}.docs` }, limitJoin] }
                    : false,
                  // Boolean indicating if more docs than limit
                },
              },
            )
            if (limitJoin > 0) {
              aggregate.push({
                $addFields: {
                  [`${as}.docs`]: {
                    $slice: [`$${as}.docs`, limitJoin],
                  },
                },
              })
            }
          })
        } else {
          const localeSuffix =
            join.field.localized && adapter.payload.config.localization && locale
              ? `.${locale}`
              : ''
          const as = `${versions ? `version.${join.joinPath}` : join.joinPath}${localeSuffix}`

          aggregate.push(
            {
              $lookup: {
                as: `${as}.docs`,
                foreignField: `${join.field.on}${localeSuffix}`,
                from: adapter.collections[slug].collection.name,
                localField: versions ? 'parent' : '_id',
                pipeline,
              },
            },
            {
              $addFields: {
                [`${as}.docs`]: {
                  $map: {
                    as: 'doc',
                    in: '$$doc._id',
                    input: `$${as}.docs`,
                  },
                }, // Slicing the docs to match the limit
                [`${as}.hasNextPage`]: {
                  $gt: [{ $size: `$${as}.docs` }, limitJoin || Number.MAX_VALUE],
                }, // Boolean indicating if more docs than limit
              },
            },
          )
          if (limitJoin > 0) {
            aggregate.push({
              $addFields: {
                [`${as}.docs`]: {
                  $slice: [`$${as}.docs`, limitJoin],
                },
              },
            })
          }
        }
      }
    }
  }

  if (projection && Object.keys(projection).length) {
    aggregate.push({
      $project: projection,
    })
  }

  return aggregate
}
