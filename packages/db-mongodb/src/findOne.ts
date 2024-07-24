import type { MongooseQueryOptions } from 'mongoose'
import type { FindOne } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

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

  let doc = await Model.findOne(query, {}, options)

  if (!doc) {
    return null
  }

  doc = this.jsonParse ? JSON.parse(JSON.stringify(doc)) : doc

  doc = sanitizeInternalFields(doc)

  return doc
}
