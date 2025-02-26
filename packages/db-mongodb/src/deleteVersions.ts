import { buildVersionCollectionFields, type DeleteVersions } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { getSession } from './utilities/getSession.js'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: MongooseAdapter,
  { collection, locale, req, where },
) {
  const VersionsModel = this.versions[collection]

  const session = await getSession(this, req)

  const query = await buildQuery({
    adapter: this,
    fields: buildVersionCollectionFields(
      this.payload.config,
      this.payload.collections[collection].config,
      true,
    ),
    locale,
    where,
  })

  await VersionsModel.deleteMany(query, { session })
}
