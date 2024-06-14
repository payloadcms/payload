import type { DeleteMany, PayloadRequestWithData } from 'payload'

import type { MongooseAdapter } from './index.js'

import { withSession } from './withSession.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: MongooseAdapter,
  { collection, req = {} as PayloadRequestWithData, where },
) {
  const Model = this.collections[collection]
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
  }

  const query = await Model.buildQuery({
    payload: this.payload,
    where,
  })

  await Model.deleteMany(query, options)
}
