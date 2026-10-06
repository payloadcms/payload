import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { CreateGlobalVersionArgs, CreateVersionArgs, Payload } from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import {
  getVersionsMax,
  hasDraftsEnabled,
  hasLocalizeStatusEnabled,
} from '../utilities/getVersionsConfig.js'
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'
import { appendVersionToQueryKey } from './drafts/appendVersionToQueryKey.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'
import { getVersionStatusQuery } from './getVersionStatusQuery.js'
import { syncPublishedLocalesToDraft } from './syncPublishedLocalesToDraft.js'
import { updateLatestVersion } from './updateLatestVersion.js'

type Args<T extends JsonObject = JsonObject> = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  docWithLocales: T
  draft?: boolean
  global?: SanitizedGlobalConfig
  id?: number | string
  operation?: 'create' | 'restoreVersion' | 'update'
  payload: Payload
  preserveDraft?: boolean
  req?: PayloadRequest
  returning?: boolean
  select?: SelectType
  unpublish?: boolean
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
  preserveDraft,
  req,
  returning,
  select,
  unpublish,
}: Args<TData>): Promise<JsonObject | null> {
  let result: JsonObject | undefined
  let createdNewVersion = false
  const now = new Date().toISOString()
  const versionData: {
    _status?: 'draft'
    updatedAt?: string
  } & TData = deepCopyObjectSimple(docWithLocales)

  if ((collection?.timestamps || global) && draft) {
    versionData.updatedAt = now
  }

  if (versionData._id) {
    delete versionData._id
  }

  // When localizeStatus is enabled, _status must be stored as a localized object.
  // Callers like restoreVersion set it as a plain string — expand it here.
  const entity = collection ?? global
  if (
    entity &&
    payload.config.localization &&
    hasLocalizeStatusEnabled(entity) &&
    typeof versionData._status === 'string'
  ) {
    const status = versionData._status
    ;(versionData as JsonObject)._status = Object.fromEntries(
      payload.config.localization.localeCodes.map((code) => [code, status]),
    )
  }

  let hasActiveDraft = false

  if (preserveDraft && entity && hasDraftsEnabled(entity)) {
    const where = {
      and: [
        { latest: { equals: true } },
        appendVersionToQueryKey(
          getVersionStatusQuery({
            entity,
            locale: 'all',
            localization: payload.config.localization,
            status: 'draft',
          }),
        ),
        ...(collection ? [{ parent: { equals: id } }] : []),
      ],
    }
    const versions = collection
      ? await payload.db.findVersions({
          collection: collection.slug,
          limit: 1,
          pagination: false,
          req,
          where,
        })
      : await payload.db.findGlobalVersions({
          global: global!.slug,
          limit: 1,
          pagination: false,
          req,
          where,
        })

    hasActiveDraft = versions.docs.length > 0

    if (hasActiveDraft) {
      await syncPublishedLocalesToDraft({
        collection,
        docWithLocales: versionData,
        draftVersion: versions.docs[0]!,
        global,
        payload,
        req,
      })
    }
  }

  try {
    if (unpublish && hasActiveDraft) {
      // The active snapshot was synchronized above. Keep its pending content and avoid adding
      // a history entry for the status change, while returning the updated main document.
      result = { parent: id, version: versionData }
    } else if (!hasActiveDraft && (unpublish || autosave)) {
      result = await updateLatestVersion({
        id,
        collection,
        global,
        now,
        payload,
        req,
        shouldUpdate: autosave ? (v) => 'autosave' in v && v.autosave === true : undefined,
        versionData,
      })
    }

    if (!result) {
      createdNewVersion = true

      const createVersionArgs = {
        autosave: Boolean(autosave),
        collectionSlug: undefined as string | undefined,
        createdAt: operation === 'restoreVersion' ? versionData.createdAt : now,
        globalSlug: undefined as string | undefined,
        latest: !hasActiveDraft,
        parent: collection ? id : undefined,
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
    throw err
  }

  const max = getVersionsMax(collection || global!)

  if (createdNewVersion && max > 0) {
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
