import type { Create, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const create: Create = async function create(
  this: MongooseAdapter,
  { collection, data, req = {} as PayloadRequest },
) {
  const Model = this.collections[collection]
  const session = await getSession(this, req)

  const fields = this.payload.collections[collection].config.flattenedFields

  if (this.payload.collections[collection].customIDType) {
    data._id = data.id
  }

  transform({
    adapter: this,
    data,
    fields,
    operation: 'create',
  })

  try {
    const { insertedId } = await Model.collection.insertOne(data, { session })
    data._id = insertedId

    transform({
      adapter: this,
      data,
      fields,
      operation: 'read',
    })

    return data
  } catch (error) {
    handleError({ collection, error, req })
  }
}
