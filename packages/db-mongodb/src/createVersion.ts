import {
  buildVersionCollectionFields,
  type CreateVersion,
  resolveBranchVersionParent,
} from 'payload'

import type { MongooseAdapter } from './index.js'

import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createVersion: CreateVersion = async function createVersion(
  this: MongooseAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    publishedLocale,
    req,
    returning,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const branched = await resolveBranchVersionParent({
    collectionSlug,
    parent,
    req,
    versionData: versionData as Record<string, unknown>,
  })

  const data = {
    autosave,
    createdAt,
    latest: true,
    parent: branched.parent,
    publishedLocale,
    snapshot,
    updatedAt,
    version: versionData,
    ...(branched.versionData._branch
      ? { _branch: branched.versionData._branch, _branchParent: branched.versionData._branchParent }
      : {}),
  }
  if (!data.createdAt) {
    data.createdAt = new Date().toISOString()
  }

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

  transform({
    adapter: this,
    data,
    fields,
    operation: 'write',
  })

  const options = {
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  }

  let [doc] = await Model.create([data], options, req)

  // No branch scoping needed here: a branch version's `parent` is the shadow
  // row's own primary key, so main's chain and the branch's chain are already
  // disjoint and `latest` clearing cannot cross between them.
  const parentQuery = {
    $or: [
      {
        parent: {
          $eq: data.parent,
        },
      },
    ],
  }

  await Model.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: doc._id,
          },
        },
        parentQuery,
        {
          latest: {
            $eq: true,
          },
        },
        {
          updatedAt: {
            $lt: new Date(doc.updatedAt),
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
