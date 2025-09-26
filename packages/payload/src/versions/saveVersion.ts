// @ts-strict-ignore
import type {
  LocalizedMeta,
  SanitizedCollectionConfig,
  TypeWithID,
} from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { CreateGlobalVersionArgs, CreateVersionArgs, Payload } from '../index.js'
import type { PayloadRequest, SelectType } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import { sanitizeInternalFields } from '../utilities/sanitizeInternalFields.js'
import { getQueryDraftsSelect } from './drafts/getQueryDraftsSelect.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'

type Args = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  docWithLocales: any
  draft?: boolean
  global?: SanitizedGlobalConfig
  id?: number | string
  locale?: null | string
  operation?: 'create' | 'restoreVersion' | 'update'
  payload: Payload
  publishSpecificLocale?: string
  req?: PayloadRequest
  select?: SelectType
  snapshot?: any
}

export const saveVersion = async ({
  id,
  autosave,
  collection,
  docWithLocales: doc,
  draft,
  global,
  locale,
  operation,
  payload,
  publishSpecificLocale,
  req,
  select,
  snapshot,
}: Args): Promise<TypeWithID> => {
  let result: TypeWithID | undefined
  let createNewVersion = true
  const now = new Date().toISOString()
  const versionData = deepCopyObjectSimple(doc)
  if (draft) {
    versionData._status = 'draft'
  }

  if (collection?.timestamps && draft) {
    versionData.updatedAt = now
  }

  if (versionData._id) {
    delete versionData._id
  }

  try {
    let docs
    const findVersionArgs = {
      limit: 1,
      pagination: false,
      req,
      sort: '-updatedAt',
    }

    if (collection) {
      ;({ docs } = await payload.db.findVersions({
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
      ;({ docs } = await payload.db.findGlobalVersions({
        ...findVersionArgs,
        global: global!.slug,
        limit: 1,
        pagination: false,
        req,
      }))
    }
    const [latestVersion] = docs

    if (autosave) {
      // overwrite the latest version if it's set to autosave
      if (latestVersion && 'autosave' in latestVersion && latestVersion.autosave === true) {
        createNewVersion = false

        const data: Record<string, unknown> = {
          createdAt: new Date(latestVersion.createdAt).toISOString(),
          latest: true,
          parent: id,
          updatedAt: now,
          version: {
            ...versionData,
          },
        }

        const updateVersionArgs = {
          id: latestVersion.id,
          req,
          versionData: data as TypeWithID,
        }

        if (collection) {
          result = await payload.db.updateVersion({
            ...updateVersionArgs,
            collection: collection.slug,
            req,
          })
        } else {
          result = await payload.db.updateGlobalVersion({
            ...updateVersionArgs,
            global: global!.slug,
            req,
          })
        }
      }
    }

    if (createNewVersion) {
      let localizedMeta: LocalizedMeta = {}
      const localizationEnabled =
        payload.config.localization && payload.config.localization.locales.length > 0

      if (
        localizationEnabled &&
        payload.config.localization !== false &&
        payload.config.experimental?.localizeMeta
      ) {
        // If `publish all`, set all locales to published
        if (versionData._status === 'published' && !publishSpecificLocale) {
          for (const code of payload.config.localization.localeCodes) {
            localizedMeta[code] = { status: 'published', updatedAt: now }
          }
        } else if (publishSpecificLocale || (locale && versionData._status === 'draft')) {
          const status = publishSpecificLocale ? 'published' : 'draft'
          const incomingLocale = String(publishSpecificLocale || locale)
          const existing = latestVersion?.version.localizedMeta

          // If no locale statuses are set, set it and set all others to draft
          if (!existing) {
            for (const code of payload.config.localization.localeCodes) {
              localizedMeta[code] = {
                status: code === incomingLocale ? status : 'draft',
                updatedAt: now,
              }
            }
          } else {
            // If locales already exist, update the status for the incoming locale
            localizedMeta = {
              ...existing,
              [incomingLocale]: { status, updatedAt: now },
            }
          }
        }
      }

      const createVersionArgs = {
        autosave: Boolean(autosave),
        collectionSlug: undefined as string | undefined,
        createdAt: operation === 'restoreVersion' ? versionData.createdAt : now,
        globalSlug: undefined as string | undefined,
        parent: collection ? id : undefined,
        publishedLocale: publishSpecificLocale || undefined,
        req,
        select: getQueryDraftsSelect({ select }),
        updatedAt: now,
        versionData: {
          ...versionData,
          localizedMeta,
        },
      }

      if (collection) {
        createVersionArgs.collectionSlug = collection.slug
        result = await payload.db.createVersion(createVersionArgs as CreateVersionArgs)
      }

      if (global) {
        createVersionArgs.globalSlug = global.slug
        result = await payload.db.createGlobalVersion(createVersionArgs as CreateGlobalVersionArgs)
      }

      if (publishSpecificLocale && snapshot) {
        const snapshotData = deepCopyObjectSimple(snapshot)
        if (snapshotData._id) {
          delete snapshotData._id
        }

        snapshotData._status = 'draft'

        const snapshotDate = new Date().toISOString()

        const updatedArgs = {
          ...createVersionArgs,
          createdAt: snapshotDate,
          returning: false,
          snapshot: true,
          updatedAt: snapshotDate,
          versionData: { ...snapshotData, localizedMeta },
        } as CreateGlobalVersionArgs & CreateVersionArgs

        if (collection) {
          await payload.db.createVersion(updatedArgs)
        }
        if (global) {
          await payload.db.createGlobalVersion(updatedArgs)
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
    return undefined!
  }

  const max = collection ? collection.versions.maxPerDoc : global!.versions.max

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

  let createdVersion = (result as any).version
  createdVersion = sanitizeInternalFields(createdVersion)
  createdVersion.id = (result as any).parent
  return createdVersion
}
