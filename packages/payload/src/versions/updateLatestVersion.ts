import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload } from '../index.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { resolveBranchOwnVersions, resolveBranchVersionParent } from '../branching/versions.js'

type Args<TData extends JsonObject> = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  now: string
  payload: Payload
  req?: PayloadRequest
  shouldUpdate?: (latestVersion: JsonObject) => boolean
  versionData: TData
}

/**
 * Finds the latest version and updates it in place if `shouldUpdate` returns true.
 * Used by both the unpublish and autosave paths in `saveVersion` to avoid creating
 * a redundant new version.
 *
 * Returns the updated version result, or `undefined` if no update was performed.
 */
export async function updateLatestVersion<TData extends JsonObject>({
  id,
  collection,
  global,
  now,
  payload,
  req,
  shouldUpdate = () => true,
  versionData,
}: Args<TData>): Promise<JsonObject | undefined> {
  let docs
  const findVersionArgs = {
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
  }

  // On a branch, the row to rewrite and the row to rewrite it *as* both differ from
  // main's. Resolved together because getting one without the other is worse than
  // getting neither: the unscoped find returns main's latest version as part of the
  // branch's ancestry (a branch reads main's history as its own past), so unpublishing
  // on a branch rewrote main's version row in place with the branch's content.
  const branched = collection
    ? await resolveBranchVersionParent({
        collectionSlug: collection.slug,
        parent: id!,
        req,
        versionData: {},
      })
    : undefined

  if (collection) {
    ;({ docs } = await payload.db.findVersions<TData>({
      ...findVersionArgs,
      collection: collection.slug,
      where: await resolveBranchOwnVersions({
        id: id!,
        collectionSlug: collection.slug,
        req,
      }),
    }))
  } else {
    ;({ docs } = await payload.db.findGlobalVersions<TData>({
      ...findVersionArgs,
      global: global!.slug,
    }))
  }

  const [latestVersion] = docs

  if (!latestVersion || !shouldUpdate(latestVersion)) {
    return undefined
  }

  const updateVersionArgs = {
    id: latestVersion.id,
    req,
    versionData: {
      createdAt: new Date(latestVersion.createdAt).toISOString(),
      latest: true,
      // The branch's chain hangs off its shadow row, and `_branch`/`_branchParent` are
      // columns on the row being replaced — omitting them would strip the row's branch
      // identity and hand it to main.
      parent: branched?.parent ?? id,
      updatedAt: now,
      version: {
        ...versionData,
      },
      ...(branched?.versionData ?? {}),
    },
  }

  let versionUpdateFailed: boolean | undefined = undefined

  try {
    if (collection) {
      return await payload.db.updateVersion<TData>({
        ...updateVersionArgs,
        collection: collection.slug,
        req,
      })
    }

    return await payload.db.updateGlobalVersion<TData>({
      ...updateVersionArgs,
      global: global!.slug,
      req,
    })
  } catch (err) {
    versionUpdateFailed = true
    payload.logger.warn({
      err,
      msg: `Failed to update latest version — checking if a concurrent write already succeeded.`,
    })
  }

  if (versionUpdateFailed) {
    // If a concurrent request already committed, return its result to avoid a duplicate version.
    // If updatedAt is unchanged, the update genuinely failed — fall back to createVersion.
    try {
      let freshDocs: JsonObject[]

      if (collection) {
        ;({ docs: freshDocs } = await payload.db.findVersions<TData>({
          collection: collection.slug,
          limit: 1,
          pagination: false,
          req,
          sort: '-updatedAt',
          where: { parent: { equals: id } },
        }))
      } else {
        ;({ docs: freshDocs } = await payload.db.findGlobalVersions<TData>({
          global: global!.slug,
          limit: 1,
          pagination: false,
          req,
          sort: '-updatedAt',
        }))
      }

      const [freshVersion] = freshDocs

      if (freshVersion && new Date(freshVersion.updatedAt) > new Date(latestVersion.updatedAt)) {
        return freshVersion
      }
    } catch {
      // If the follow-up query also fails, fall through to createVersion
    }
  }

  return undefined
}
