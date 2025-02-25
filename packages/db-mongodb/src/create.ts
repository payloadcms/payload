import type { CreateOptions } from 'mongoose'
import type { Create, Document } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection, data, req },
) {
  const Model = this.collections[collection]
  const options: CreateOptions = {
    session: await getSession(this, req),
  }

  let doc

  transform({
    adapter: this,
    data,
    fields: this.payload.collections[collection].config.fields,
    operation: 'write',
  })

  if (this.payload.collections[collection].customIDType) {
    data._id = data.id
  }

  try {
    ;[doc] = await Model.create([data], options)
  } catch (error) {
    handleError({ collection, error, req })
  }

  doc = doc.toObject()

  transform({
    adapter: this,
    data: doc,
    fields: this.payload.collections[collection].config.fields,
    operation: 'read',
  })

  return doc
}
