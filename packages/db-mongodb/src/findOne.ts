import type { MongooseQueryOptions } from 'mongoose'
import type { Document, FindOne, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, joins, locale, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection]
  const collectionConfig = this.payload.collections[collection].config
  const options: MongooseQueryOptions = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  const aggregate = await buildJoinAggregation({
    adapter: this,
    collection,
    collectionConfig,
    joins,
    limit: 1,
    locale,
    query,
  })

  let doc
  if (aggregate) {
    ;[doc] = await Model.aggregate(aggregate, options)
  } else {
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
