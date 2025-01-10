import type { CreateOptions } from 'mongoose'

import { buildVersionGlobalFields, type CreateGlobalVersion, type Document } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'

export const createGlobalVersion: CreateGlobalVersion = async function createGlobalVersion(
  this: MongooseAdapter,
  {
    autosave,
    createdAt,
    globalSlug,
    parent,
    publishedLocale,
    req,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const VersionModel = this.versions[globalSlug]
  const options: CreateOptions = {
    session: await getSession(this, req),
  }

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

  const [doc] = await VersionModel.create([data], options, req)

  await VersionModel.updateMany(
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

  const result: Document = JSON.parse(JSON.stringify(doc))
  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }
  return result
}
