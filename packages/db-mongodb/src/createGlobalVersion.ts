import { buildVersionGlobalFields, type CreateGlobalVersion } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: MongooseAdapter,
  {
    autosave,
    createdAt,
    globalSlug,
    parent,
    publishedLocale,
    req,
    returning,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug, versions: true })

  const options = {
    session: await getSession(this, req),
  }

  const data = {
    autosave,
    createdAt,
    latest: true,
    parent,
    publishedLocale,
    snapshot,
    updatedAt,
    version: versionData,
  }

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig)

  transform({
    adapter: this,
    data,
    fields,
    operation: 'write',
  })

  let [doc] = await Model.create([data], options, req)

  await Model.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: doc._id,
          },
        },
        {
          parent: {
            $eq: parent,
          },
        },
        {
          latest: {
            $eq: true,
          },
        },
      ],
    },
    { $unset: { latest: 1 } },
    options,
  )

  if (returning === false) {
    return null
  }

  doc = doc.toObject()

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc
}
