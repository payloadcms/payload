import type { QueryOptions } from 'mongoose'
import type { DeleteMany, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQueryWithAggregate } from './utilities/buildQueryWithAggregate.js'
import { withSession } from './withSession.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: MongooseAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  const Model = this.collections[collection]
  const options: QueryOptions = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const query = await buildQueryWithAggregate({
    Model,
    payload: this.payload,
    session: options.session,
    where,
  })

  await Model.deleteMany(query, options)
}
