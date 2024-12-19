import type { DeleteMany } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: MongooseAdapter,
  { collection, req, where },
) {
  const Model = this.collections[collection]

  const session = await getSession(this, req)

  const query = await Model.buildQuery({
    payload: this.payload,
    session,
    where,
  })

  await Model.collection.deleteMany(query, {
    session,
  })
}
