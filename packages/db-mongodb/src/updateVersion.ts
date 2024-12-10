import { buildVersionCollectionFields, type PayloadRequest, type UpdateVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { transform } from './utilities/transform.js'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: MongooseAdapter,
  {
    id,
    collection,
    locale,
    options: optionsArgs = {},
    req = {} as PayloadRequest,
    select,
    versionData,
    where,
  },
) {
  const VersionModel = this.versions[collection]
  const whereToUse = where || { id: { equals: id } }
  const fields = buildVersionCollectionFields(
    this.payload.config,
    this.payload.collections[collection].config,
    true,
  )

  const session = await getSession(this, req)

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    session,
    where: whereToUse,
  })

  transform({
    adapter: this,
    data: versionData,
    fields,
    operation: 'update',
  })

  const doc = await VersionModel.collection.findOneAndUpdate(
    query,
    { $set: versionData },
    {
      ...optionsArgs,
      projection: buildProjectionFromSelect({
        adapter: this,
        fields: buildVersionCollectionFields(
          this.payload.config,
          this.payload.collections[collection].config,
          true,
        ),
        select,
      }),
      returnDocument: 'after',
      session,
    },
  )

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc as any
}
