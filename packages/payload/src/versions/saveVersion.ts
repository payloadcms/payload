import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Field } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { CreateGlobalVersionArgs, CreateVersionArgs, Payload } from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import { assertNoValidationWrite } from '../utilities/assertNoValidationWrite.js'
import {
  getVersionsMax,
  hasDraftsEnabled,
  hasLocalizeStatusEnabled,
} from '../utilities/getVersionsConfig.js'
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'
import { getLatestCollectionVersion } from './getLatestCollectionVersion.js'
import { getLatestGlobalVersion } from './getLatestGlobalVersion.js'
import { updateLatestVersion } from './updateLatestVersion.js'

const SYSTEM_FIELDS = new Set(['_id', '_status', 'createdAt', 'id', 'updatedAt'])

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

function mergeDraftData({
  fields,
  incoming,
  locale,
  localeCodes,
  target,
}: {
  fields?: Field[]
  incoming: Record<string, unknown>
  locale?: string
  localeCodes?: string[]
  target: Record<string, unknown>
}): void {
  for (const [key, value] of Object.entries(incoming)) {
    if (SYSTEM_FIELDS.has(key)) {
      continue
    }

    const fieldConfig = fields?.find((f) => 'name' in f && f.name === key)
    const isLocalized =
      Boolean(fieldConfig && 'localized' in fieldConfig && fieldConfig.localized) ||
      Boolean(
        localeCodes &&
          isPlainObject(target[key]) &&
          Object.keys(target[key] as object).every((k) => localeCodes.includes(k)),
      )

    if (isLocalized && locale) {
      if (
        isPlainObject(value) &&
        localeCodes &&
        Object.keys(value).every((k) => localeCodes.includes(k))
      ) {
        target[key] = {
          ...(isPlainObject(target[key]) ? (target[key] as object) : {}),
          ...value,
        }
      } else {
        target[key] = {
          ...(isPlainObject(target[key]) ? (target[key] as object) : {}),
          [locale]: value,
        }
      }
    } else if (isPlainObject(target[key]) && isPlainObject(value)) {
      const nestedFields =
        fieldConfig && 'fields' in fieldConfig && Array.isArray(fieldConfig.fields)
          ? fieldConfig.fields
          : undefined
      mergeDraftData({
        fields: nestedFields,
        incoming: value,
        locale,
        localeCodes,
        target: target[key] as Record<string, unknown>,
      })
    } else {
      target[key] = value
    }
  }
}

type Args<T extends JsonObject = JsonObject> = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  docWithLocales: T
  draft?: boolean
  draftData?: JsonObject
  global?: SanitizedGlobalConfig
  id?: number | string
  operation?: 'create' | 'restoreVersion' | 'update'
  payload: Payload
  publish?: boolean
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
  draftData,
  global,
  operation,
  payload,
  publish,
  req,
  returning,
  select,
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

  const isNonDraftWithDrafts =
    operation === 'update' && !draft && !publish && Boolean(entity && hasDraftsEnabled(entity))

  try {
    if (unpublish || (autosave && !isNonDraftWithDrafts)) {
      result = await updateLatestVersion({
        id,
        collection,
        global,
        now,
        payload,
        req,
        shouldUpdate: autosave
          ? (v) => {
              if (!('autosave' in v && v.autosave === true)) {
                return false
              }
              if (isNonDraftWithDrafts) {
                const status = (v as { version?: { _status?: unknown } })?.version?._status
                const isDraft =
                  typeof status === 'string'
                    ? status === 'draft'
                    : typeof status === 'object' && status !== null
                      ? Object.values(status).some((s) => s === 'draft')
                      : false
                if (isDraft) {
                  return false
                }
              }
              return true
            }
          : undefined,
        versionData,
      })
    }

    if (!result) {
      createdNewVersion = true

      let latest = true
      let pendingDraftDoc: JsonObject | undefined

      if (isNonDraftWithDrafts) {
        const unlocalizedReq = req ? ({ ...req, locale: undefined } as PayloadRequest) : undefined
        if (collection && id !== undefined) {
          const latestDoc = await getLatestCollectionVersion({
            id,
            config: collection,
            payload,
            query: { collection: collection.slug, locale: 'all', where: { id: { equals: id } } },
            req: unlocalizedReq,
          })
          const latestStatus = latestDoc?._status
          const hasPendingDraft =
            typeof latestStatus === 'string'
              ? latestStatus === 'draft'
              : typeof latestStatus === 'object' && latestStatus !== null
                ? Object.values(latestStatus).some((s) => s === 'draft')
                : false

          if (hasPendingDraft) {
            latest = false
            pendingDraftDoc = latestDoc
          }
        } else if (global) {
          const { global: latestDoc } = await getLatestGlobalVersion({
            slug: global.slug,
            config: global,
            locale: 'all',
            payload,
            req: unlocalizedReq,
            where: {},
          })
          const latestStatus = latestDoc?._status
          const hasPendingDraft =
            typeof latestStatus === 'string'
              ? latestStatus === 'draft'
              : typeof latestStatus === 'object' && latestStatus !== null
                ? Object.values(latestStatus).some((s) => s === 'draft')
                : false

          if (hasPendingDraft) {
            latest = false
            pendingDraftDoc = latestDoc
          }
        }
      }

      const createVersionArgs = {
        autosave: Boolean(autosave),
        collectionSlug: undefined as string | undefined,
        createdAt: operation === 'restoreVersion' ? versionData.createdAt : now,
        globalSlug: undefined as string | undefined,
        latest,
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

      if (pendingDraftDoc) {
        const updatedPendingDraftData = deepCopyObjectSimple(pendingDraftDoc)

        if (draftData && typeof draftData === 'object') {
          const localeCodes = payload.config.localization
            ? payload.config.localization.localeCodes
            : undefined

          mergeDraftData({
            fields: entity?.fields,
            incoming: draftData,
            locale: req?.locale || undefined,
            localeCodes,
            target: updatedPendingDraftData,
          })
        }

        if (updatedPendingDraftData._id) {
          delete updatedPendingDraftData._id
        }

        const draftCreateArgs = {
          autosave: false,
          collectionSlug: collection?.slug,
          createdAt: now,
          globalSlug: global?.slug,
          latest: true,
          parent: collection ? id : undefined,
          req,
          returning: false,
          select: undefined,
          updatedAt: now,
          versionData: updatedPendingDraftData,
        }

        if (collection) {
          await payload.db.createVersion(draftCreateArgs as CreateVersionArgs)
        } else if (global) {
          await payload.db.createGlobalVersion(draftCreateArgs as CreateGlobalVersionArgs)
        }
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
