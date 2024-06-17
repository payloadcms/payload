import type { DeleteVersions, PayloadRequestWithData } from 'payload'

import type { MongooseAdapter } from './index.js'

import { withSession } from './withSession.js'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: MongooseAdapter,
  { collection, locale, req = {} as PayloadRequestWithData, where },
) {
  const VersionsModel = this.versions[collection]
  const options = {
    ...withSession(this, req.transactionID),
    lean: true,
  }

  const query = await VersionsModel.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  await VersionsModel.deleteMany(query, options)
}
