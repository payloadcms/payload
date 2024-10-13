import { buildVersionGlobalFields, type CreateGlobalVersion, type PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { sanitizeDocument } from './utilities/sanitizeDocument.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

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
  const options = await withSession(this, req)

  const data = sanitizeRelationshipIDs({
    config: this.payload.config,
    data: {
      autosave,
      createdAt,
      latest: true,
      parent,
      publishedLocale,
      snapshot,
      updatedAt,
      version: versionData,
    },
    fields: buildVersionGlobalFields(
      this.payload.config,
      this.payload.config.globals.find((global) => global.slug === globalSlug),
    ),
  })

  let [result] = await VersionModel.create([data], options, req)

  await VersionModel.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: result._id,
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

  result = result.toObject()
  sanitizeDocument(result)

  return result
}
