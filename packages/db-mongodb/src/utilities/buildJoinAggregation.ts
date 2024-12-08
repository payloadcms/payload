import type { ClientSession } from 'mongodb'
import type { PipelineStage } from 'mongoose'
import type { CollectionSlug, JoinQuery, SanitizedCollectionConfig, Where } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildSortParam } from '../queries/buildSortParam.js'

type BuildJoinAggregationArgs = {
  adapter: MongooseAdapter
  collection: CollectionSlug
  collectionConfig: SanitizedCollectionConfig
  joins: JoinQuery
  locale: string
  projection?: Record<string, true>
  session?: ClientSession
  /** whether the query is from drafts */
  versions?: boolean
}

export const buildJoinAggregation = async ({
  adapter,
  collection,
  collectionConfig,
  joins,
  locale,
  projection,
  session,
  versions,
}: BuildJoinAggregationArgs): Promise<PipelineStage[] | undefined> => {
  if (Object.keys(collectionConfig.joins).length === 0 || joins === false) {
    return
  }

  const joinConfig = adapter.payload.collections[collection].config.joins
  const aggregate: PipelineStage[] = []

  for (const slug of Object.keys(joinConfig)) {
    for (const join of joinConfig[slug]) {
      const joinModel = adapter.collections[join.field.collection]

      if (projection && !projection[join.joinPath]) {
        continue
      }

      if (joins?.[join.joinPath] === false) {
        continue
      }

      const {
        limit: limitJoin = join.field.defaultLimit ?? 10,
        sort: sortJoin = join.field.defaultSort || collectionConfig.defaultSort,
        where: whereJoin,
      } = joins?.[join.joinPath] || {}

      const $sort = buildSortParam({
        config: adapter.payload.config,
        fields: adapter.payload.collections[slug].config.flattenedFields,
        locale,
        sort: sortJoin,
        timestamps: true,
      })

      const $match = await joinModel.buildQuery({
        locale,
        payload: adapter.payload,
        session,
        where: whereJoin,
      })

      const pipeline: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = [
        { $match },
        {
          $sort,
        },
      ]

      if (limitJoin > 0) {
        pipeline.push({
          $limit: limitJoin + 1,
        })
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
          join.field.localized && adapter.payload.config.localization && locale ? `.${locale}` : ''
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

  if (!aggregate.length) {
    return
  }

  return aggregate
}
