import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { deepCopyObjectSimple } from '../index.js'
import sanitizeInternalFields from '../utilities/sanitizeInternalFields.js'
import { enforceMaxVersions } from './enforceMaxVersions.js'

type Args = {
  autosave?: boolean
  collection?: SanitizedCollectionConfig
  docWithLocales: any
  draft?: boolean
  global?: SanitizedGlobalConfig
  id?: number | string
  payload: Payload
  publishSpecificLocale?: string
  req?: PayloadRequest
  snapshot?: any
}

export const saveVersion = async ({
  id,
  autosave,
  collection,
  docWithLocales: doc,
  draft,
  global,
  payload,
  publishSpecificLocale,
  req,
  snapshot,
}: Args): Promise<TypeWithID> => {
  let result
  let createNewVersion = true
  const now = new Date().toISOString()
  const versionData = deepCopyObjectSimple(doc)
  if (draft) {
    versionData._status = 'draft'
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
        ;({ docs } = await payload.db.findVersions({
          ...findVersionArgs,
          collection: collection.slug,
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
          global: global.slug,
          req,
        }))
      }
      const [latestVersion] = docs

      // overwrite the latest version if it's set to autosave
      if (latestVersion?.autosave === true) {
        createNewVersion = false

        const data: Record<string, unknown> = {
          createdAt: new Date(latestVersion.createdAt).toISOString(),
          updatedAt: draft ? now : new Date(doc.updatedAt).toISOString(),
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
            global: global.slug,
            req,
          })
        }
      }
    }

    if (createNewVersion) {
      const createVersionArgs = {
        autosave: Boolean(autosave),
        collectionSlug: undefined,
        createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : now,
        globalSlug: undefined,
        parent: collection ? id : undefined,
        publishedLocale: publishSpecificLocale || undefined,
        req,
        updatedAt: draft ? now : new Date(doc.updatedAt).toISOString(),
        versionData,
      }

      if (collection) {
        createVersionArgs.collectionSlug = collection.slug
        result = await payload.db.createVersion(createVersionArgs)
      }

      if (global) {
        createVersionArgs.globalSlug = global.slug
        result = await payload.db.createGlobalVersion(createVersionArgs)
      }

      if (publishSpecificLocale && snapshot) {
        const snapshotData = deepCopyObjectSimple(snapshot)
        if (snapshotData._id) {delete snapshotData._id}

        snapshotData._status = 'draft'

        const snapshotDate = new Date().toISOString()

        const updatedArgs = {
          ...createVersionArgs,
          createdAt: snapshotDate,
          snapshot: true,
          updatedAt: snapshotDate,
          versionData: snapshotData,
        } as any

        if (collection) {
          await payload.db.createVersion(updatedArgs)
        }
        if (global) {
          await payload.db.createGlobalVersion(updatedArgs)
        }
      }
    }
  } catch (err) {
    let errorMessage: string

    if (collection) {
      errorMessage = `There was an error while saving a version for the ${collection.labels.singular} with ID ${id}.`
    }
    if (global) {
      errorMessage = `There was an error while saving a version for the global ${global.label}.`
    }
    payload.logger.error(errorMessage)
    payload.logger.error(err)
    return
  }

  let max = 100

  if (collection && typeof collection.versions.maxPerDoc === 'number') {
    max = collection.versions.maxPerDoc
  }
  if (global && typeof global.versions.max === 'number') {
    max = global.versions.max
  }

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

  let createdVersion = result.version
  createdVersion.createdAt = result.createdAt
  createdVersion.updatedAt = result.updatedAt

  createdVersion = sanitizeInternalFields(createdVersion)
  createdVersion.id = result.parent

  return createdVersion
}
