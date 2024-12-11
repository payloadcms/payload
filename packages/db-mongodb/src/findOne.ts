import type { FindOne, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { transform } from './utilities/transform.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, joins, locale, req = {} as PayloadRequest, select, where },
) {
  const Model = this.collections[collection]
  const collectionConfig = this.payload.collections[collection].config

  const session = await getSession(this, req)

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    session,
    where,
  })

  const fields = collectionConfig.flattenedFields

  const projection = buildProjectionFromSelect({
    adapter: this,
    fields,
    select,
  })

  const joinAggregation = await buildJoinAggregation({
    adapter: this,
    collection,
    collectionConfig,
    joins,
    locale,
    projection,
    session,
  })

  let doc
  if (joinAggregation) {
    const cursor = Model.collection.aggregate(
      [
        {
          $match: query,
        },
      ],
      { session },
    )
    cursor.limit(1)
    for (const stage of joinAggregation) {
      cursor.addStage(stage)
    }

    ;[doc] = await cursor.toArray()
  } else {
    doc = await Model.collection.findOne(query, { projection, session })
  }

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
