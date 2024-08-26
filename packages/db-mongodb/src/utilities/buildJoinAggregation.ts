import type { PipelineStage } from 'mongoose'
import type { CollectionSlug, JoinQuery, SanitizedCollectionConfig } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { buildSortParam } from '../queries/buildSortParam.js'

type BuildJoinAggregationArgs = {
  adapter: MongooseAdapter
  collection: CollectionSlug
  collectionConfig: SanitizedCollectionConfig
  joins: JoinQuery
  locale: string
}

export const buildJoinAggregation = async ({
  adapter,
  collection,
  collectionConfig,
  joins,
  locale,
}: BuildJoinAggregationArgs): Promise<PipelineStage[] | undefined> => {
  if (Object.keys(collectionConfig.joins).length === 0 || joins === false) {
    return
  }

  const promises = []
  const joinConfig = adapter.payload.collections[collection].config.joins
  const aggregate: PipelineStage[] = [
    {
      $sort: { createdAt: -1 },
    },
  ]

  for (const slug of Object.keys(joinConfig)) {
    for (const join of joinConfig[slug]) {
      const joinModel = adapter.collections[join.field.collection]

      const {
        limit: limitJoin = 10,
        pagination = false,
        sort: sortJoin,
        where: whereJoin,
      } = joins[join.schemaPath] || {}

      const useSimplePagination = pagination === false && limitJoin > 0
      const sort = buildSortParam({
        config: adapter.payload.config,
        fields: adapter.payload.collections[slug].config.fields,
        locale,
        sort: sortJoin || collectionConfig.defaultSort,
        timestamps: true,
      })
      const sortProperty = Object.keys(sort)[0]
      const sortDirection = sort[sortProperty] === 'asc' ? 1 : -1

      const $match = await joinModel.buildQuery({
        locale,
        payload: adapter.payload,
        where: whereJoin,
      })

      let $limit
      if (useSimplePagination) {
        $limit = limitJoin + 1
      } else if (limitJoin > 0) {
        $limit = limitJoin
      }
      const pipeline = [
        {
          $limit,
        },
        {
          $match,
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]

      if (adapter.payload.config.localization && locale === 'all') {
        adapter.payload.config.localization.localeCodes.forEach((code) => {
          const as = `${join.schemaPath}.${code}`
          const asAlias = `${join.schemaPath}.${code}`.replaceAll('.', '_')

          aggregate.push(
            {
              $lookup: {
                as,
                foreignField: `${join.field.on}.${code}`,
                from: slug,
                localField: '_id',
                pipeline,
              },
            },
            {
              $sort: { [sortProperty]: sortDirection },
            },
            {
              $addFields: {
                [asAlias]: as,
              },
            },
            {
              $unwind: {
                path: `$${asAlias}`,
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: '$_id',
                [asAlias]: { $push: `$${as}._id` },
                originalDocument: { $first: '$$ROOT' },
              },
            },
          )
        })
      } else {
        const localeSuffix =
          join.field.localized && adapter.payload.config.localization && locale ? `.${locale}` : ''
        const as = `${join.schemaPath}${localeSuffix}`
        const asAlias = `${join.schemaPath}${localeSuffix}`.replaceAll('.', '_')

        aggregate.push(
          {
            $lookup: {
              as,
              foreignField: `${join.field.on}${localeSuffix}`,
              from: slug,
              localField: '_id',
              pipeline,
            },
          },
          {
            $sort: { [sortProperty]: sortDirection },
          },
          {
            $addFields: {
              [asAlias]: as,
            },
          },
          {
            $unwind: {
              path: `$${asAlias}`,
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$_id',
              [asAlias]: { $push: `$${as}._id` },
              originalDocument: { $first: '$$ROOT' },
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: ['$originalDocument', { [asAlias]: `$${asAlias}` }],
              },
            },
          },
        )
      }
    }
  }

  await Promise.all(promises)

  return aggregate
}
