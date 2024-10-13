import type { QueryOptions } from 'mongoose'
import type { PayloadRequest, UpdateOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { handleError } from './utilities/handleError.js'
import { sanitizeDocument } from './utilities/sanitizeDocument.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  {
    id,
    collection,
    data,
    locale,
    options: optionsArgs = {},
    req = {} as PayloadRequest,
    where: whereArg,
  },
) {
  const where = id ? { id: { equals: id } } : whereArg
  const Model = this.collections[collection]
  const options: QueryOptions = {
    ...optionsArgs,
    ...(await withSession(this, req)),
    lean: true,
    new: true,
  }

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  const sanitizedData = sanitizeRelationshipIDs({
    config: this.payload.config,
    data,
    fields: this.payload.collections[collection].config.fields,
  })

  let doc
  try {
    doc = await Model.findOneAndUpdate(query, sanitizedData, options)
  } catch (error) {
    handleError({ collection, error, req })
  }

  sanitizeDocument(doc)

  return doc
}
