import type { Create, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { handleError } from './utilities/handleError.js'
import { sanitizeDocument } from './utilities/sanitizeDocument.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection, data, req = {} as PayloadRequest },
) {
  const Model = this.collections[collection]
  const options = await withSession(this, req)
  let doc

  const sanitizedData = sanitizeRelationshipIDs({
    config: this.payload.config,
    data,
    fields: this.payload.collections[collection].config.fields,
  })

  try {
    ;[doc] = await Model.create([sanitizedData], options)
  } catch (error) {
    handleError({ collection, error, req })
  }

  doc = doc.toObject()
  sanitizeDocument(doc)

  return doc
}
