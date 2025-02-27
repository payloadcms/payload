import type { AggregateOptions, QueryOptions } from 'mongoose'

import { type FindOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection: collectionSlug, joins, locale, req, select, where = {} },
) {
  const { collectionConfig, Model } = getCollection({ adapter: this, collectionSlug })

  const session = await getSession(this, req)
  const options: AggregateOptions & QueryOptions = {
    lean: true,
    session,
  }

  const query = await buildQuery({
    adapter: this,
    collectionSlug,
    fields: collectionConfig.flattenedFields,
    locale,
    where,
  })

  const projection = buildProjectionFromSelect({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    select,
  })

  const aggregate = await buildJoinAggregation({
    adapter: this,
    collection: collectionSlug,
    collectionConfig,
    joins,
    limit: 1,
    locale,
    projection,
    query,
  })

  let doc
  if (aggregate) {
    ;[doc] = await Model.aggregate(aggregate, { session })
  } else {
    ;(options as Record<string, unknown>).projection = projection
    doc = await Model.findOne(query, {}, options)
  }

  if (!doc) {
    return null
  }

  transform({ adapter: this, data: doc, fields: collectionConfig.fields, operation: 'read' })

  return doc
}
