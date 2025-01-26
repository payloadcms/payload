import type { CreateOptions } from 'mongoose'
import type { Create, Document } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection, data, req },
) {
  const Model = this.collections[collection]
  const options: CreateOptions = {
    session: await getSession(this, req),
  }

  let doc

  const sanitizedData = sanitizeRelationshipIDs({
    config: this.payload.config,
    data,
    fields: this.payload.collections[collection].config.fields,
  })

  if (this.payload.collections[collection].customIDType) {
    sanitizedData._id = sanitizedData.id
  }

  try {
    ;[doc] = await Model.create([sanitizedData], options)
  } catch (error) {
    handleError({ collection, error, req })
  }

  // doc.toJSON does not do stuff like converting ObjectIds to string, or date strings to date objects. That's why we use JSON.parse/stringify here
  const result: Document = JSON.parse(JSON.stringify(doc))
  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }

  return result
}
