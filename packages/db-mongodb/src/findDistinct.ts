import type { PipelineStage } from 'mongoose'

import { type FindDistinct, getFieldByPath } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const findDistinct: FindDistinct = async function (this: MongooseAdapter, args) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug: args.collection,
  })

  const session = await getSession(this, args.req)

  const { where = {} } = args

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

  const page = args.page || 1

  const basePipeline: PipelineStage[] = [
    {
      $match: query,
    },
    {
      $group: {
        _id: `$${fieldPath}`,
      },
    },
  ]

  const pipeline: PipelineStage[] = [
    ...basePipeline,
    {
      $sort: {
        _id: args.sortOrder === 'desc' ? -1 : 1,
      },
    },
  ]

  const getValues = () => {
    return Model.aggregate(pipeline, { session }).then((res) =>
      res.map((each) => ({
        [args.field]: JSON.parse(JSON.stringify(each._id)),
      })),
    )
  }

  if (args.limit) {
    pipeline.push({
      $skip: (page - 1) * args.limit,
    })
    pipeline.push({ $limit: args.limit })
    const totalDocs = await Model.aggregate([...basePipeline, { $count: 'count' }], {
      session,
    }).then((res) => res[0]?.count ?? 0)
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
