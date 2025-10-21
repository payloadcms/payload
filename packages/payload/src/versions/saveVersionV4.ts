import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload, TypeWithVersion } from '../index.js'
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js'
import type { TypeWithVersionCreate } from './types.js'

import { deepCopyObjectSimple } from '../index.js'
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'
import { saveSnapshot } from './saveSnapshot.js'

type Args<T extends JsonObject = JsonObject> = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  isSavingDraft?: boolean
  payload: Payload
  publishSpecificLocale?: string
  publishSpecificLocales?: string[]
  req?: PayloadRequest
  select?: SelectType
  snapshotToSave?: T
  unpublishSpecificLocales?: string[]
} & (
  | {
      latestVersion: TypeWithVersion<T>
      operation?: 'update'
    }
  | {
      latestVersion: TypeWithVersionCreate<T>
      operation?: 'create' | 'restoreVersion'
    }
)

export type VersionDocType<T extends JsonObject = JsonObject> =
  | Omit<TypeWithVersion<T>, 'parent'>
  | TypeWithVersion<T>

export type SaveVersionResult<T extends JsonObject = JsonObject> =
  | {
      snapshotVersionDoc?: undefined | VersionDocType<T>
      versionDoc: VersionDocType<T>
    }
  | undefined

export const saveVersionV4 = async <T extends JsonObject = JsonObject>({
  id,
  autosave,
  collection,
  global,
  isSavingDraft,
  latestVersion,
  operation,
  payload,
  publishSpecificLocale,
  publishSpecificLocales,
  req,
  select,
  snapshotToSave,
  unpublishSpecificLocales,
}: Args<T>): Promise<SaveVersionResult<T>> => {
  if (collection && !collection?.versions) {
    return undefined
  }
  if (global && !global?.versions) {
    return undefined
  }

  let result: Omit<TypeWithVersion<JsonObject>, 'parent'> | TypeWithVersion<JsonObject> | undefined
  const now = new Date().toISOString()
  const docData: {
    _status?: 'draft' | 'published'
    updatedAt?: string
  } & T = deepCopyObjectSimple(latestVersion.version) as Record<string, unknown> & T
  let snapshotVersionDoc: Omit<TypeWithVersion<T>, 'parent'> | TypeWithVersion<T> | undefined =
    undefined

  if (isSavingDraft) {
    docData._status = 'draft'
  }

  if (collection?.timestamps && isSavingDraft) {
    docData.updatedAt = now
  }

  if (docData._id) {
    delete docData._id
  }

  try {
    // overwrite the latest version if it's set to autosave
    if (
      autosave &&
      latestVersion &&
      'autosave' in latestVersion &&
      latestVersion.autosave === true &&
      operation === 'update'
    ) {
      const sharedVersionData = {
        createdAt: new Date(latestVersion.createdAt).toISOString(),
        latest: true,
        updatedAt: now,
        version: docData,
      }

      if (collection) {
        result = await payload.db.updateVersion<T>({
          id: latestVersion.id,
          collection: collection.slug,
          req,
          versionData: {
            ...sharedVersionData,
            parent: id,
          },
        })
      } else {
        result = await payload.db.updateGlobalVersion<T>({
          id: latestVersion.id,
          global: global!.slug,
          req,
          versionData: sharedVersionData,
        })
      }
    } else {
      const { updatedPublishedLocales, updatedUnpublishedLocales } =
        updatePublishedUnpublishedLocales({
          latestVersion,
          publishSpecificLocales,
          unpublishSpecificLocales,
        })

      const createVersionArgs = {
        autosave: Boolean(autosave),
        createdAt: operation === 'restoreVersion' ? String(docData.createdAt) : now,
        publishedLocale: publishSpecificLocale || undefined,
        // publishedLocales: mergedPublishedLocales,
        // unpublishedLocales: unpublishSpecificLocales || undefined,
        req,
        select: getQueryDraftsSelect({ select }),
        updatedAt: now,
        versionData: docData,
      }

      if (collection && id) {
        result = await payload.db.createVersion<T>({
          ...createVersionArgs,
          collectionSlug: collection.slug,
          parent: id,
        })
      }

      if (global) {
        result = await payload.db.createGlobalVersion<T>({
          ...createVersionArgs,
          globalSlug: global.slug,
        })
      }

      const max = collection ? collection.versions.maxPerDoc : global!.versions.max

      if (max > 0) {
        await enforceMaxVersions({
          id,
          collection,
          global,
          max,
          payload,
          req,
        })
      }

      if (snapshotToSave) {
        snapshotVersionDoc = await saveSnapshot({
          id,
          autosave,
          collection,
          data: snapshotToSave,
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
  }

  if (result?.version) {
    return {
      snapshotVersionDoc,
      versionDoc: {
        ...result,
        version: sanitizeInternalFields(result.version as T),
      },
    }
  }

  return undefined
}

type UpdateLocalesArgs = {
  latestVersion: {
    publishedLocales?: string[]
    unpublishedLocales?: string[]
  } & TypeWithVersionCreate<any>
  publishSpecificLocales?: string[]
  unpublishSpecificLocales?: string[]
}

type UpdateLocalesResult = {
  updatedPublishedLocales: string[] | undefined
  updatedUnpublishedLocales: string[] | undefined
}

/**
 * Helper function to update published and unpublished locales
 * based on specific locale publish or unpublish.
 */
const updatePublishedUnpublishedLocales = ({
  latestVersion,
  publishSpecificLocales,
  unpublishSpecificLocales,
}: UpdateLocalesArgs): UpdateLocalesResult => {
  let updatedPublishedLocales: string[] | undefined = undefined
  let updatedUnpublishedLocales: string[] | undefined = undefined

  const hasPublishSpecificLocales =
    Array.isArray(publishSpecificLocales) && publishSpecificLocales.length > 0
  const hasUnpublishSpecificLocales =
    Array.isArray(unpublishSpecificLocales) && unpublishSpecificLocales.length > 0

  if (hasPublishSpecificLocales || hasUnpublishSpecificLocales) {
    const existingPublishedLocales = latestVersion?.publishedLocales || []
    const existingUnpublishedLocales = latestVersion?.unpublishedLocales || []

    // Start with existing locales
    const publishedSet = new Set<string>(existingPublishedLocales)
    const unpublishedSet = new Set<string>(existingUnpublishedLocales)

    // Handle publishing specific locales
    if (hasPublishSpecificLocales) {
      publishSpecificLocales.forEach((locale) => {
        publishedSet.add(locale)
        unpublishedSet.delete(locale)
      })
    }

    // Handle unpublishing specific locales
    if (hasUnpublishSpecificLocales) {
      unpublishSpecificLocales.forEach((locale) => {
        unpublishedSet.add(locale)
        publishedSet.delete(locale)
      })
    }

    // Convert sets back to arrays
    const publishedArray = Array.from(publishedSet)
    const unpublishedArray = Array.from(unpublishedSet)

    // Set to undefined if empty, otherwise assign the array
    updatedPublishedLocales = publishedArray.length > 0 ? publishedArray : undefined
    updatedUnpublishedLocales = unpublishedArray.length > 0 ? unpublishedArray : undefined
  }

  return {
    updatedPublishedLocales,
    updatedUnpublishedLocales,
  }
}
