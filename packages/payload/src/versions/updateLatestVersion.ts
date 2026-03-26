import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload } from '../index.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

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

  if (collection) {
    ;({ docs } = await payload.db.findVersions<TData>({
      ...findVersionArgs,
      collection: collection.slug,
      where: {
        parent: {
          equals: id,
        },
      },
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
      parent: id,
      updatedAt: now,
      version: {
        ...versionData,
      },
    },
  }

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
}
