import type { PipelineStage } from 'mongoose'

import {
  APIError,
  appendVersionToQueryKey,
  buildVersionCollectionFields,
  type CollectionSlug,
  combineQueries,
  type FlattenedField,
  getQueryDraftsSort,
  type JoinQuery,
  type SanitizedCollectionConfig,
} from 'payload'
import { fieldShouldBeLocalized } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'
import type { CollectionModel } from '../types.js'

import { buildQuery } from '../queries/buildQuery.js'
import { buildSortParam } from '../queries/buildSortParam.js'
import { getCollection } from './getEntity.js'

type BuildJoinAggregationArgs = {
  adapter: MongooseAdapter
  collection: CollectionSlug
  collectionConfig: SanitizedCollectionConfig
  draftsEnabled?: boolean
  joins?: JoinQuery
  locale?: string
  projection?: Record<string, true>
  // the where clause for the top collection
  query?: Record<string, unknown>
  /** whether the query is from drafts */
  versions?: boolean
}

export const buildJoinAggregation = async ({
  adapter,
  collection,
  collectionConfig,
  draftsEnabled,
  joins,
  locale,
  projection,
  versions,
}: BuildJoinAggregationArgs): Promise<PipelineStage[] | undefined> => {
  if (
    (Object.keys(collectionConfig.joins).length === 0 &&
      collectionConfig.polymorphicJoins.length == 0) ||
    joins === false
  ) {
    return
  }

  const joinConfig = adapter.payload.collections[collection]?.config?.joins

  if (!joinConfig) {
    throw new APIError(`Could not retrieve sanitized join config for ${collection}.`)
  }

  const aggregate: PipelineStage[] = []
  const polymorphicJoinsConfig = adapter.payload.collections[collection]?.config?.polymorphicJoins

  if (!polymorphicJoinsConfig) {
    throw new APIError(`Could not retrieve sanitized polymorphic joins config for ${collection}.`)
  }

  for (const join of polymorphicJoinsConfig) {
    if (projection && !projection[join.joinPath]) {
      continue
    }

    if (joins?.[join.joinPath] === false) {
      continue
    }

    const {
      count = false,
      limit: limitJoin = join.field.defaultLimit ?? 10,
      page,
      sort: sortJoin = join.field.defaultSort || collectionConfig.defaultSort,
      where: whereJoin = {},
    } = joins?.[join.joinPath] || {}

    const aggregatedFields: FlattenedField[] = []
    for (const collectionSlug of join.field.collection) {
      const { collectionConfig } = getCollection({ adapter, collectionSlug })

      for (const field of collectionConfig.flattenedFields) {
        if (!aggregatedFields.some((eachField) => eachField.name === field.name)) {
          aggregatedFields.push(field)
        }
      }
    }

    const sort = buildSortParam({
      adapter,
      config: adapter.payload.config,
      fields: aggregatedFields,
      locale,
      sort: sortJoin,
      timestamps: true,
    })

    const $match = await buildQuery({
      adapter,
      fields: aggregatedFields,
      locale,
      where: whereJoin,
    })

    const sortProperty = Object.keys(sort)[0]! // assert because buildSortParam always returns at least 1 key.
    const sortDirection = sort[sortProperty] === 'asc' ? 1 : -1

    const projectSort = sortProperty !== '_id' && sortProperty !== 'relationTo'

    const aliases: string[] = []

    const as = join.joinPath

    for (const collectionSlug of join.field.collection) {
      const alias = `${as}.docs.${collectionSlug}`
      aliases.push(alias)

      const basePipeline = [
        {
          $addFields: {
            relationTo: {
              $literal: collectionSlug,
            },
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: {
                  $eq: [`$${join.field.on}`, '$$root_id_'],
                },
              },
              $match,
            ],
          },
        },
      ]

      const { Model: JoinModel } = getCollection({ adapter, collectionSlug })

      aggregate.push({
        $lookup: {
          as: alias,
          from: JoinModel.collection.name,
          let: {
            root_id_: '$_id',
          },
          pipeline: [
            ...basePipeline,
            {
              $sort: {
                [sortProperty]: sortDirection,
              },
            },
            {
              // Unfortunately, we can't use $skip here because we can lose data, instead we do $slice then
              $limit: page ? page * limitJoin : limitJoin,
            },
            {
              $project: {
                value: '$_id',
                ...(projectSort && {
                  [sortProperty]: 1,
                }),
                relationTo: 1,
              },
            },
          ],
        },
      })

      if (count) {
        aggregate.push({
          $lookup: {
            as: `${as}.totalDocs.${alias}`,
            from: JoinModel.collection.name,
            let: {
              root_id_: '$_id',
            },
            pipeline: [
              ...basePipeline,
              {
                $count: 'result',
              },
            ],
          },
        })
      }
    }

    aggregate.push({
      $addFields: {
        [`${as}.docs`]: {
          $concatArrays: aliases.map((alias) => `$${alias}`),
        },
      },
    })

    if (count) {
      aggregate.push({
        $addFields: {
          [`${as}.totalDocs`]: {
            $add: aliases.map((alias) => ({
              $ifNull: [
                {
                  $first: `$${as}.totalDocs.${alias}.result`,
                },
                0,
              ],
            })),
          },
        },
      })
    }

    aggregate.push({
      $set: {
        [`${as}.docs`]: {
          $sortArray: {
            input: `$${as}.docs`,
            sortBy: {
              [sortProperty]: sortDirection,
            },
          },
        },
      },
    })

    const sliceValue = page ? [(page - 1) * limitJoin, limitJoin] : [limitJoin]

    aggregate.push({
      $addFields: {
        [`${as}.hasNextPage`]: {
          $gt: [{ $size: `$${as}.docs` }, limitJoin || Number.MAX_VALUE],
        },
      },
    })

    aggregate.push({
      $set: {
        [`${as}.docs`]: {
          $slice: [`$${as}.docs`, ...sliceValue],
        },
      },
    })
  }

  for (const slug of Object.keys(joinConfig)) {
    const joinsList = joinConfig[slug]

    if (!joinsList) {
      throw new APIError(`Failed to retrieve array of joins for ${slug} in collectio ${collection}`)
    }

    for (const join of joinsList) {
      if (projection && !projection[join.joinPath]) {
        continue
      }

      if (joins?.[join.joinPath] === false) {
        continue
      }

      const collectionConfig = adapter.payload.collections[join.field.collection as string]?.config

      if (!collectionConfig) {
        throw new APIError(
          `Collection config for ${join.field.collection.toString()} was not found`,
        )
      }

      let JoinModel: CollectionModel | undefined

      const useDrafts = (draftsEnabled || versions) && Boolean(collectionConfig.versions.drafts)

      if (useDrafts) {
        JoinModel = adapter.versions[collectionConfig.slug]
      } else {
        JoinModel = adapter.collections[collectionConfig.slug]
      }

      if (!JoinModel) {
        throw new APIError(`Join Model was not found for ${collectionConfig.slug}`)
      }

      const {
        count,
        limit: limitJoin = join.field.defaultLimit ?? 10,
        page,
        sort: sortJoin = join.field.defaultSort || collectionConfig.defaultSort,
        where: whereJoin = {},
      } = joins?.[join.joinPath] || {}

      if (Array.isArray(join.field.collection)) {
        throw new Error('Unreachable')
      }

      const fields = useDrafts
        ? buildVersionCollectionFields(adapter.payload.config, collectionConfig, true)
        : collectionConfig.flattenedFields

      const sort = buildSortParam({
        adapter,
        config: adapter.payload.config,
        fields,
        locale,
        sort: useDrafts ? getQueryDraftsSort({ collectionConfig, sort: sortJoin }) : sortJoin,
        timestamps: true,
      })
      const sortProperty = Object.keys(sort)[0]!
      const sortDirection = sort[sortProperty] === 'asc' ? 1 : -1

      const $match = await JoinModel.buildQuery({
        locale,
        payload: adapter.payload,
        where: useDrafts
          ? combineQueries(appendVersionToQueryKey(whereJoin), {
              latest: {
                equals: true,
              },
            })
          : whereJoin,
      })

      const pipeline: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = [
        { $match },
        {
          $sort: { [sortProperty]: sortDirection },
        },
      ]

      if (page) {
        pipeline.push({
          $skip: (page - 1) * limitJoin,
        })
      }

      if (limitJoin > 0) {
        pipeline.push({
          $limit: limitJoin + 1,
        })
      }

      let polymorphicSuffix = ''
      if (Array.isArray(join.targetField.relationTo)) {
        polymorphicSuffix = '.value'
      }

      const addTotalDocsAggregation = (as: string, foreignField: string) =>
        aggregate.push(
          {
            $lookup: {
              as: `${as}.totalDocs`,
              foreignField,
              from: JoinModel.collection.name,
              localField: versions ? 'parent' : '_id',
              pipeline: [
                {
                  $match,
                },
                {
                  $count: 'result',
                },
              ],
            },
          },
          {
            $addFields: {
              [`${as}.totalDocs`]: { $ifNull: [{ $first: `$${as}.totalDocs.result` }, 0] },
            },
          },
        )

      let foreignFieldPrefix = ''

      if (useDrafts) {
        foreignFieldPrefix = 'version.'
      }

      if (adapter.payload.config.localization && locale === 'all') {
        adapter.payload.config.localization.localeCodes.forEach((code) => {
          const as = `${versions ? `version.${join.joinPath}` : join.joinPath}${code}`

          aggregate.push(
            {
              $lookup: {
                as: `${as}.docs`,
                foreignField: `${foreignFieldPrefix}${join.field.on}${code}${polymorphicSuffix}`,
                from: JoinModel.collection.name,
                localField: versions ? 'parent' : '_id',
                pipeline,
              },
            },
            {
              $addFields: {
                [`${as}.docs`]: {
                  $map: {
                    as: 'doc',
                    in: useDrafts ? `$$doc.parent` : '$$doc._id',
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

          if (count) {
            addTotalDocsAggregation(
              as,
              `${foreignFieldPrefix}${join.field.on}${code}${polymorphicSuffix}`,
            )
          }
        })
      } else {
        const localeSuffix =
          fieldShouldBeLocalized({
            field: join.field,
            parentIsLocalized: join.parentIsLocalized,
          }) &&
          adapter.payload.config.localization &&
          locale
            ? `.${locale}`
            : ''
        const as = `${versions ? `version.${join.joinPath}` : join.joinPath}${localeSuffix}`

        let foreignField: string

        if (join.getForeignPath) {
          foreignField = `${join.getForeignPath({ locale })}${polymorphicSuffix}`
        } else {
          foreignField = `${join.field.on}${polymorphicSuffix}`
        }

        aggregate.push(
          {
            $lookup: {
              as: `${as}.docs`,
              foreignField: `${foreignFieldPrefix}${foreignField}`,
              from: JoinModel.collection.name,
              localField: versions ? 'parent' : '_id',
              pipeline,
            },
          },
          {
            $addFields: {
              [`${as}.docs`]: {
                $map: {
                  as: 'doc',
                  in: useDrafts ? `$$doc.parent` : '$$doc._id',
                  input: `$${as}.docs`,
                },
              }, // Slicing the docs to match the limit
              [`${as}.hasNextPage`]: {
                $gt: [{ $size: `$${as}.docs` }, limitJoin || Number.MAX_VALUE],
              }, // Boolean indicating if more docs than limit
            },
          },
        )

        if (count) {
          addTotalDocsAggregation(as, `${foreignFieldPrefix}${foreignField}`)
        }

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

  return aggregate
}
