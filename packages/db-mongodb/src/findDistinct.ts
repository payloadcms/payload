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

  const page = args.page ?? 1

  const pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    {
      $group: {
        _id: `$${fieldPath}`,
      },
    },
    {
      $sort: {
        _id: args.sortOrder === 'desc' ? -1 : 1,
      },
    },
  ]

  if (args.limit) {
    pipeline.push({
      $skip: (page - 1) * args.limit,
    })
    pipeline.push({ $limit: args.limit })
  }

  const values = await Model.aggregate(pipeline).then((res) => res.map((each) => each._id))

  return {
    field: args.field,
    perPage: args.limit ?? values.length,
    totalDocs: args.limit ?? values.length,
    values,
  }
}
