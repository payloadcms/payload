import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { CreateGlobalVersionArgs, CreateVersionArgs, Payload } from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import { assertNoValidationWrite } from '../utilities/assertNoValidationWrite.js'
import { getVersionsMax, hasLocalizeStatusEnabled } from '../utilities/getVersionsConfig.js'
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'
import { markTransactionWrite } from '../utilities/transactionMutationTracker.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'
import { coalesceLatestVersionContextKey, updateLatestVersion } from './updateLatestVersion.js'

type Args<T extends JsonObject = JsonObject> = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  docWithLocales: T
  draft?: boolean
  global?: SanitizedGlobalConfig
  id?: number | string
  operation?: 'create' | 'restoreVersion' | 'update'
  payload: Payload
  req?: PayloadRequest
  returning?: boolean
  select?: SelectType
  shouldReturnVersionDocument?: boolean
  unpublish?: boolean
}

export const captureSavedVersionIDContextKey = Symbol.for('payload.versions.captureSavedVersionID')

export type CaptureSavedVersionID = (args: {
  collectionSlug?: string
  globalSlug?: string
  versionID: number | string
}) => void

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
  req,
  returning,
  select,
  shouldReturnVersionDocument,
  unpublish,
}: Args<TData>): Promise<JsonObject | null> {
  assertNoValidationWrite(req)

  let result: JsonObject | undefined
  let createdNewVersion = false
  const now = new Date().toISOString()
  const versionData: {
    _status?: 'draft'
    updatedAt?: string
  } & TData = deepCopyObjectSimple(docWithLocales)
  const shouldCoalesceLatestVersion =
    (req?.context as Record<PropertyKey, unknown> | undefined)?.[
      coalesceLatestVersionContextKey
    ] === true

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

  try {
    if (unpublish || autosave || shouldCoalesceLatestVersion) {
      result = await updateLatestVersion({
        id,
        collection,
        global,
        now,
        payload,
        req,
        shouldUpdate: shouldCoalesceLatestVersion
          ? undefined
          : autosave
            ? (v) => 'autosave' in v && v.autosave === true
            : undefined,
        versionData,
      })
      if (result) {
        markTransactionWrite({ req })
      }
    }

    if (!result) {
      createdNewVersion = true

      const createVersionArgs = {
        autosave: Boolean(autosave),
        collectionSlug: undefined as string | undefined,
        createdAt: operation === 'restoreVersion' ? versionData.createdAt : now,
        globalSlug: undefined as string | undefined,
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
      markTransactionWrite({ req })
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

  const versionID = result?.id
  const captureSavedVersionID = (req?.context as Record<PropertyKey, unknown> | undefined)?.[
    captureSavedVersionIDContextKey
  ] as CaptureSavedVersionID | undefined

  if (captureSavedVersionID && (typeof versionID === 'number' || typeof versionID === 'string')) {
    captureSavedVersionID({
      collectionSlug: collection?.slug,
      globalSlug: global?.slug,
      versionID,
    })
  }

  if (returning === false) {
    return null
  }

  if (shouldReturnVersionDocument) {
    return result as JsonObject
  }

  let createdVersion = (result as any).version

  createdVersion = sanitizeInternalFields(createdVersion)
  createdVersion.id = (result as any).parent

  return createdVersion
}
