import { buildVersionGlobalFields, type CreateGlobalVersion, type PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: MongooseAdapter,
  {
    autosave,
    createdAt,
    globalSlug,
    parent,
    publishedLocale,
    req = {} as PayloadRequest,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const VersionModel = this.versions[globalSlug]
  const session = await getSession(this, req)

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

  const fields = buildVersionGlobalFields(
    this.payload.config,
    this.payload.config.globals.find((global) => global.slug === globalSlug),
    true,
  )

  transform({
    adapter: this,
    data,
    fields,
    operation: 'create',
  })

  const { insertedId } = await VersionModel.collection.insertOne(data, { session })
  ;(data as any)._id = insertedId

  await VersionModel.collection.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: insertedId,
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
    { session },
  )

  transform({
    adapter: this,
    data,
    fields,
    operation: 'read',
  })

  return data as any
}
