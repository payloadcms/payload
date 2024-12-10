import type { AggregateOptions, PipelineStage, QueryOptions } from 'mongoose'
import type { Document, FindOne, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildAggregation } from './utilities/buildAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { mergeProjections } from './utilities/mergeProjections.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, joins, locale, req = {} as PayloadRequest, select, where },
) {
  const Model = this.collections[collection]
  const collectionConfig = this.payload.collections[collection].config
  const options: QueryOptions = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const pipeline: PipelineStage.Lookup[] = []

  const queryProjection = {}

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    pipeline,
    projection: queryProjection,
    session: options.session,
    where,
  })

  const projection = mergeProjections({
    queryProjection,
    selectProjection: buildProjectionFromSelect({
      adapter: this,
      fields: collectionConfig.flattenedFields,
      select,
    }),
  })

  const aggregate = await buildAggregation({
    adapter: this,
    collection,
    collectionConfig,
    joins,
    limit: 1,
    locale,
    pipeline,
    projection,
    query,
  })

  let doc
  if (aggregate) {
    ;[doc] = await Model.aggregate(aggregate, options as AggregateOptions)
  } else {
    ;(options as Record<string, unknown>).projection = projection
    doc = await Model.findOne(query, {}, options)
  }

  if (!doc) {
    return null
  }

  let result: Document = JSON.parse(JSON.stringify(doc))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
