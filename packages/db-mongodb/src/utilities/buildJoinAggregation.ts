import type { PipelineStage } from 'mongoose'
import type {
  CollectionSlug,
  FlattenedField,
  JoinQuery,
  SanitizedCollectionConfig,
  Where,
} from 'payload'

import { fieldShouldBeLocalized } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

import { buildQuery } from '../queries/buildQuery.js'
import { buildSortParam } from '../queries/buildSortParam.js'

type BuildJoinAggregationArgs = {
  adapter: MongooseAdapter
  collection: CollectionSlug
  collectionConfig: SanitizedCollectionConfig
  joins: JoinQuery
  // the number of docs to get at the top collection level
  limit?: number
  locale: string
  projection?: Record<string, true>
  // the where clause for the top collection
  query?: Where
  /** whether the query is from drafts */
  versions?: boolean
}

export const buildJoinAggregation = async ({
  adapter,
  collection,
  collectionConfig,
  joins,
  limit,
  locale,
  projection,
  query,
  versions,
}: BuildJoinAggregationArgs): Promise<PipelineStage[] | undefined> => {
  if (
    (Object.keys(collectionConfig.joins).length === 0 &&
      collectionConfig.polymorphicJoins.length == 0) ||
    joins === false
  ) {
    return
  }

  const joinConfig = adapter.payload.collections[collection].config.joins
  const polymorphicJoinsConfig = adapter.payload.collections[collection].config.polymorphicJoins
  const aggregate: PipelineStage[] = [
    {
      $sort: { createdAt: -1 },
    },
  ]

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
      where: whereJoin,
    } = joins?.[join.joinPath] || {}

    const aggregatedFields: FlattenedField[] = []
    for (const collectionSlug of join.field.collection) {
      for (const field of adapter.payload.collections[collectionSlug].config.flattenedFields) {
        if (!aggregatedFields.some((eachField) => eachField.name === field.name)) {
          aggregatedFields.push(field)
        }
      }
    }

    const sort = buildSortParam({
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

    const sortProperty = Object.keys(sort)[0]
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

      aggregate.push({
        $lookup: {
          as: alias,
          from: adapter.collections[collectionSlug].collection.name,
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
            from: adapter.collections[collectionSlug].collection.name,
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
    for (const join of joinConfig[slug]) {
      if (projection && !projection[join.joinPath]) {
        continue
      }

      if (joins?.[join.joinPath] === false) {
        continue
      }

      const {
        count,
        limit: limitJoin = join.field.defaultLimit ?? 10,
        page,
        sort: sortJoin = join.field.defaultSort || collectionConfig.defaultSort,
        where: whereJoin,
      } = joins?.[join.joinPath] || {}

      if (Array.isArray(join.field.collection)) {
        throw new Error('Unreachable')
      }

      const joinModel = adapter.collections[join.field.collection]

      const sort = buildSortParam({
        config: adapter.payload.config,
        fields: adapter.payload.collections[slug].config.flattenedFields,
        locale,
        sort: sortJoin,
        timestamps: true,
      })
      const sortProperty = Object.keys(sort)[0]
      const sortDirection = sort[sortProperty] === 'asc' ? 1 : -1

      const $match = await joinModel.buildQuery({
        locale,
        payload: adapter.payload,
        where: whereJoin,
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
              from: adapter.collections[slug].collection.name,
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

      if (adapter.payload.config.localization && locale === 'all') {
        adapter.payload.config.localization.localeCodes.forEach((code) => {
          const as = `${versions ? `version.${join.joinPath}` : join.joinPath}${code}`

          aggregate.push(
            {
              $lookup: {
                as: `${as}.docs`,
                foreignField: `${join.field.on}${code}${polymorphicSuffix}`,
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

          if (count) {
            addTotalDocsAggregation(as, `${join.field.on}${code}${polymorphicSuffix}`)
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
              foreignField,
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

        if (count) {
          addTotalDocsAggregation(as, foreignField)
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

  if (projection) {
    aggregate.push({ $project: projection })
  }

  return aggregate
}
