import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { CreateGlobalVersionArgs, CreateVersionArgs, Payload } from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import { getVersionsMax } from '../utilities/getVersionsConfig.js'
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'
import { saveSnapshot } from './saveSnapshot.js'

type Args<T extends JsonObject = JsonObject> = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  docWithLocales: T
  draft?: boolean
  global?: SanitizedGlobalConfig
  id?: number | string
  operation?: 'create' | 'restoreVersion' | 'update'
  payload: Payload
  publishSpecificLocale?: string
  req?: PayloadRequest
  returning?: boolean
  select?: SelectType
  snapshot?: any
}

export async function saveVersion<TData extends JsonObject = JsonObject>(
  args: { returning: false } & Args<TData>,
): Promise<null>
export async function saveVersion<TData extends JsonObject = JsonObject>(
  args: { returning: true } & Args<TData>,
): Promise<JsonObject>
export async function saveVersion<TData extends JsonObject = JsonObject>(
  args: Omit<Args<TData>, 'returning'>,
): Promise<JsonObject>
export async function saveVersion<TData extends JsonObject = JsonObject>({
  id,
  autosave,
  collection,
  docWithLocales,
  draft,
  global,
  operation,
  payload,
  publishSpecificLocale,
  req,
  returning,
  select,
  snapshot,
}: Args<TData>): Promise<JsonObject | null> {
  let result: JsonObject | undefined
  let createNewVersion = true
  const now = new Date().toISOString()
  const versionData: {
    _status?: 'draft'
    updatedAt?: string
  } & TData = deepCopyObjectSimple(docWithLocales)

  if (collection?.timestamps && draft) {
    versionData.updatedAt = now
  }

  if (versionData._id) {
    delete versionData._id
  }

  try {
    if (autosave) {
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
          limit: 1,
          pagination: false,
          req,
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
          limit: 1,
          pagination: false,
          req,
        }))
      }
      const [latestVersion] = docs

      // overwrite the latest version if it's set to autosave
      if (latestVersion && 'autosave' in latestVersion && latestVersion.autosave === true) {
        createNewVersion = false

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
          result = await payload.db.updateVersion<TData>({
            ...updateVersionArgs,
            collection: collection.slug,
            req,
          })
        } else {
          result = await payload.db.updateGlobalVersion<TData>({
            ...updateVersionArgs,
            global: global!.slug,
            req,
          })
        }
      }
    }

    if (createNewVersion) {
      const createVersionArgs = {
        autosave: Boolean(autosave),
        collectionSlug: undefined as string | undefined,
        createdAt: operation === 'restoreVersion' ? versionData.createdAt : now,
        globalSlug: undefined as string | undefined,
        parent: collection ? id : undefined,
        publishedLocale: publishSpecificLocale || undefined,
        req,
        returning,
        select: getQueryDraftsSelect({ select }),
        updatedAt: now,
        versionData,
      }

      if (collection) {
        createVersionArgs.collectionSlug = collection.slug
        result = await payload.db.createVersion(createVersionArgs as CreateVersionArgs)
      }

      if (global) {
        createVersionArgs.globalSlug = global.slug
        result = await payload.db.createGlobalVersion(createVersionArgs as CreateGlobalVersionArgs)
      }

      if (snapshot) {
        await saveSnapshot<TData>({
          id,
          autosave,
          collection,
          data: snapshot,
          global,
          payload,
          publishSpecificLocale,
          req,
          select,
        })
      }
    }
  } catch (err) {
    let errorMessage: string | undefined

    if (collection) {
      errorMessage = `There was an error while saving a version for the ${typeof collection.labels.singular === 'string' ? collection.labels.singular : collection.slug} with ID ${id}.`
    }
    if (global) {
      errorMessage = `There was an error while saving a version for the global ${typeof global.label === 'string' ? global.label : global.slug}.`
    }
    payload.logger.error({ err, msg: errorMessage })
    return undefined!
  }

  const max = getVersionsMax(collection || global!)

  if (createNewVersion && max > 0) {
    await enforceMaxVersions({
      id,
      collection,
      global,
      max,
      payload,
      req,
    })
  }
  if (returning === false) {
    return null
  }

  let createdVersion = (result as any).version

  createdVersion = sanitizeInternalFields(createdVersion)
  createdVersion.id = (result as any).parent

  return createdVersion
}
