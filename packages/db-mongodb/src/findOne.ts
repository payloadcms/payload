import type { PipelineStage } from 'mongoose'
import type { FindOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { findMany } from './utilities/findMany.js'
import { getSession } from './utilities/getSession.js'
import { mergeProjections } from './utilities/mergeProjections.js'
import { transform } from './utilities/transform.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, joins, locale, req, select, where },
) {
  const Model = this.collections[collection]
  const collectionConfig = this.payload.collections[collection].config

  const session = await getSession(this, req)

  const queryAggregation: PipelineStage[] = []

  const queryProjection = {}

  const query = await Model.buildQuery({
    aggregation: queryAggregation,
    locale,
    payload: this.payload,
    projection: queryProjection,
    session,
    where,
  })

  const fields = collectionConfig.flattenedFields

  const projection = mergeProjections({
    queryProjection,
    selectProjection: buildProjectionFromSelect({
      adapter: this,
      fields,
      select,
    }),
  })

  const joinAggregation = await buildJoinAggregation({
    adapter: this,
    collection,
    collectionConfig,
    joins,
    locale,
    session,
  })

  const {
    docs: [doc],
  } = await findMany({
    adapter: this,
    collection: Model.collection,
    joinAggregation,
    limit: 1,
    pagination: false,
    projection,
    query,
    queryAggregation,
    session,
  })

  if (!doc) {
    return null
  }

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc
}
