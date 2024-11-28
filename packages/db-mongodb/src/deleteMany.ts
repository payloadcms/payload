import type { DeleteMany, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: MongooseAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection]

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  })

  await Model.collection.deleteMany(query, {
    session: await getSession(this, req),
  })
}
