import type { DeleteVersions } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: MongooseAdapter,
  { collection, locale, req, where },
) {
  const VersionsModel = this.versions[collection]

  const session = await getSession(this, req)

  const query = await VersionsModel.buildQuery({
    locale,
    payload: this.payload,
    where,
  })

  await VersionsModel.deleteMany(query, { session })
}
