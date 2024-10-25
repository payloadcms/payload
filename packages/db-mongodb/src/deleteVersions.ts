import type { QueryOptions } from 'mongoose'
import type { DeleteVersions, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQueryWithAggregate } from './utilities/buildQueryWithAggregate.js'
import { withSession } from './withSession.js'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: MongooseAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
) {
  const VersionsModel = this.versions[collection]
  const options: QueryOptions = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const query = await buildQueryWithAggregate({
    locale,
    Model: VersionsModel,
    payload: this.payload,
    session: options.session,
    where,
  })

  await VersionsModel.deleteMany(query, options)
}
