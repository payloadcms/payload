import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { CreateGlobalVersionArgs, CreateVersionArgs, Payload } from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'
import type { BranchWriteObservation } from './branches/writes/prepareBranchWrite.js'

import { deepCopyObjectSimple } from '../index.js'
import { assertNoValidationWrite } from '../utilities/assertNoValidationWrite.js'
import {
  getVersionsMax,
  hasAutosaveEnabled,
  hasLocalizeStatusEnabled,
} from '../utilities/getVersionsConfig.js'
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'
import { persistBranchAutosave, persistBranchWrite } from './branches/writes/persistBranchWrite.js'
import {
  assertBranchWriteCutover,
  isBranchWriteEngineActive,
} from './branches/writes/prepareBranchWrite.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'
import { updateLatestVersion } from './updateLatestVersion.js'

type Args<T extends JsonObject = JsonObject> = {
  autosave?: boolean
  branchWrite?: BranchWriteObservation | null
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
  branchWrite,
  collection,
  docWithLocales,
  draft,
  global,
  operation,
  payload,
  req,
  returning,
  select,
  unpublish,
}: Args<TData>): Promise<JsonObject | null> {
  assertNoValidationWrite(req)

  if (
    !branchWrite &&
    (collection ?? global) &&
    (await isBranchWriteEngineActive({ entity: (collection ?? global)!, req }))
  ) {
    throw new Error(
      'An activated branch write requires observations captured before document hooks.',
    )
  }

  if (branchWrite) {
    await assertBranchWriteCutover({ cutover: branchWrite.cutover, req: req! })
  }

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

  const isBranchAutosave = Boolean(
    branchWrite &&
    draft &&
    autosave &&
    hasAutosaveEnabled((collection ?? global)!) &&
    operation !== 'restoreVersion',
  )

  try {
    if (isBranchAutosave) {
      result = await persistBranchAutosave({
        id,
        collection,
        global,
        now,
        observation: branchWrite!,
        req: req!,
        versionData,
      })
      createdNewVersion = true
    }
    if (!branchWrite && (unpublish || autosave)) {
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
        ...(branchWrite && branchWrite.workingBranchID !== 'drafts' && draft
          ? { branchMode: true as const }
          : {}),
        collectionSlug: undefined as string | undefined,
        createdAt: operation === 'restoreVersion' ? versionData.createdAt : now,
        globalSlug: undefined as string | undefined,
        parent: collection ? id : undefined,
        req,
        returning: branchWrite ? true : returning,
        select: branchWrite ? undefined : getQueryDraftsSelect({ select }),
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

  if (branchWrite && !isBranchAutosave) {
    await persistBranchWrite({
      id,
      collection,
      draft: Boolean(draft),
      global,
      observation: branchWrite,
      req: req!,
      versionID: result!.id as number | string,
    })
  }

  const max = getVersionsMax(collection || global!)

  if (createdNewVersion && max > 0) {
    await enforceMaxVersions({
      id,
      collection,
      global,
      isBranchWrite: Boolean(branchWrite),
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
