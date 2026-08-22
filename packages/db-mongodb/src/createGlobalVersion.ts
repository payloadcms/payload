import { MAIN_BRANCH, resolveBranch } from 'payload'
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
    publishedLocale,
    req,
    returning,
    snapshot,
    updatedAt,
    versionData,
  },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug, versions: true })

  const versionBranch = req?.payload?.config?.branching?.branchableGlobals?.has(globalSlug)
    ? resolveBranch(req as never)
    : MAIN_BRANCH

  const data = {
    _branch: versionBranch,
    autosave,
    createdAt,
    latest: true,
    publishedLocale,
    snapshot,
    updatedAt,
    version: versionData,
  }
  if (!data.createdAt) {
    data.createdAt = new Date().toISOString()
  }

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig)

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

  let [doc] = await Model.create([data], options)

  // Scoped by `_branch`. Unlike collection versions, global versions have no
  // `parent` to separate streams by — every version of a global shares one — so
  // without this an unscoped clear would wipe main's latest flag from a branch.
  await Model.updateMany(
    {
      $and: [
        {
          _id: {
            $ne: doc._id,
          },
        },
        {
          latest: {
            $eq: true,
          },
        },
        {
          $or: [
            { _branch: { $eq: versionBranch } },
            ...(versionBranch === MAIN_BRANCH ? [{ _branch: { $exists: false } }] : []),
          ],
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
