import type { PipelineStage } from 'mongoose'

import { type FindDistinct, getFieldByPath } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const findDistinct: FindDistinct = async function (this: MongooseAdapter, args) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug: args.collection,
  })

  const session = await getSession(this, args.req)

  const { where = {} } = args

  const sortAggregation: PipelineStage[] = []

  const sort = buildSortParam({
    adapter: this,
    config: this.payload.config,
    fields: collectionConfig.flattenedFields,
    locale: args.locale,
    sort: args.sort ?? args.field,
    sortAggregation,
    timestamps: true,
  })

  const query = await buildQuery({
    adapter: this,
    collectionSlug: args.collection,
    fields: collectionConfig.flattenedFields,
    locale: args.locale,
    where,
  })

  const fieldPathResult = getFieldByPath({
    fields: collectionConfig.flattenedFields,
    path: args.field,
  })
  let fieldPath = args.field
  if (fieldPathResult?.pathHasLocalized && args.locale) {
    fieldPath = fieldPathResult.localizedPath.replace('<locale>', args.locale)
  }

  const isHasManyValue =
    fieldPathResult && 'hasMany' in fieldPathResult.field && fieldPathResult.field.hasMany

  const page = args.page || 1

  const sortProperty = Object.keys(sort)[0]! // assert because buildSortParam always returns at least 1 key.
  const sortDirection = sort[sortProperty] === 'asc' ? 1 : -1

  let $unwind: any = ''
  let $group: any = null
  if (
    isHasManyValue &&
    sortAggregation.length &&
    sortAggregation[0] &&
    '$lookup' in sortAggregation[0]
  ) {
    $unwind = { path: `$${sortAggregation[0].$lookup.as}`, preserveNullAndEmptyArrays: true }
    $group = {
      _id: {
        _field: `$${sortAggregation[0].$lookup.as}._id`,
        _sort: `$${sortProperty}`,
      },
    }
  } else if (isHasManyValue) {
    $unwind = { path: `$${args.field}`, preserveNullAndEmptyArrays: true }
  }

  if (!$group) {
    $group = {
      _id: {
        _field: `$${fieldPath}`,
        ...(sortProperty === fieldPath
          ? {}
          : {
              _sort: `$${sortProperty}`,
            }),
      },
    }
  }

  const pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    ...(sortAggregation.length > 0 ? sortAggregation : []),
    ...($unwind
      ? [
          {
            $unwind,
          },
        ]
      : []),
    {
      $group,
    },
    {
      $sort: {
        [sortProperty === fieldPath ? '_id._field' : '_id._sort']: sortDirection,
      },
    },
  ]

  const getValues = async () => {
    return Model.aggregate(pipeline, { session }).then((res) =>
      res.map((each) => ({
        [args.field]: JSON.parse(JSON.stringify(each._id._field)),
      })),
    )
  }

  if (args.limit) {
    pipeline.push({
      $skip: (page - 1) * args.limit,
    })
    pipeline.push({ $limit: args.limit })
    const totalDocs = await Model.aggregate(
      [
        {
          $match: query,
        },
        {
          $group: {
            _id: `$${fieldPath}`,
          },
        },
        { $count: 'count' },
      ],
      {
        session,
      },
    ).then((res) => res[0]?.count ?? 0)
    const totalPages = Math.ceil(totalDocs / args.limit)
    const hasPrevPage = page > 1
    const hasNextPage = totalPages > page
    const pagingCounter = (page - 1) * args.limit + 1

    return {
      hasNextPage,
      hasPrevPage,
      limit: args.limit,
      nextPage: hasNextPage ? page + 1 : null,
      page,
      pagingCounter,
      prevPage: hasPrevPage ? page - 1 : null,
      totalDocs,
      totalPages,
      values: await getValues(),
    }
  }

  const values = await getValues()

  return {
    hasNextPage: false,
    hasPrevPage: false,
    limit: 0,
    page: 1,
    pagingCounter: 1,
    totalDocs: values.length,
    totalPages: 1,
    values,
  }
}
