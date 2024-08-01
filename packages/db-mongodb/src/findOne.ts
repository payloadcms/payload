import type { MongooseQueryOptions } from 'mongoose'
import type { Document, FindOne, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findOne: FindOne = async function findOne(
  this: MongooseAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection]
  const options: MongooseQueryOptions = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  const doc = await Model.findOne(query, {}, options)

  const joins = this.payload.collections[collection].joins

  for (const slug of Object.keys(joins)) {
    // fetch docs and add to the keys by path
    const joinModel = this.collections[slug]

    for (const join of joins[slug]) {
      const joinData = await joinModel
        .find(
          { [join.path]: { $eq: doc?._id.toString() } },
          {
            _id: 1,
          },
          options,
        )
        .limit(10)

      // TODO: handle assigning join data to nested paths
      // iterate path and assign object
      doc[join.name] = joinData.map((a) => a._id.toString())
    }
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
