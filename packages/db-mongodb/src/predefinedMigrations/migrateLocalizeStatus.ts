import type { ClientSession } from 'mongoose'
import type { Payload, PayloadRequest } from 'payload'

import { calculateVersionLocaleStatuses, type VersionRecord } from 'payload/migrations'

import type { MongooseAdapter } from '../index.js'

import { getSession } from '../utilities/getSession.js'

export type LocalizeStatusArgs = {
  collectionSlug?: string
  globalSlug?: string
  payload: Payload
  req?: any
  session?: ClientSession
}

/**
 * Migrate all collections and globals with versions.drafts enabled to use per-locale _status.
 *
 * This migration:
 * 1. Converts version._status from a scalar string to a locale-keyed object for each entity
 * 2. Deletes all snapshot:true version documents from each versions collection
 * 3. Unsets the `snapshot` field from remaining version documents
 */
export async function migrateLocalizeStatus({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  if (!payload.config.localization) {
    payload.logger.info({
      msg: 'Localization not enabled, skipping localize-status migration',
    })
    return
  }

  const collections = payload.config.collections.filter(
    (c) =>
      c.versions?.drafts &&
      typeof c.versions.drafts === 'object' &&
      c.versions.drafts.localizeStatus,
  )
  const globals = payload.config.globals.filter(
    (g) =>
      g.versions?.drafts &&
      typeof g.versions.drafts === 'object' &&
      g.versions.drafts.localizeStatus,
  )

  payload.logger.info({
    msg: `Starting localize-status migration for ${collections.length} collection(s) and ${globals.length} global(s)`,
  })

  const connection = (payload.db as any).connection
  const session = await getSession(payload.db as MongooseAdapter, req)

  for (const collection of collections) {
    await localizeStatus({ collectionSlug: collection.slug, payload, req, session })
    await cleanupSnapshotDocuments({ connection, entitySlug: collection.slug, payload, session })
  }

  for (const global of globals) {
    await localizeStatus({ globalSlug: global.slug, payload, req, session })
    await cleanupSnapshotDocuments({ connection, entitySlug: global.slug, payload, session })
  }

  payload.logger.info({ msg: 'localize-status migration completed successfully' })
}

/**
 * Converts version._status (and the main document _status) from a scalar string to a
 * per-locale object for a single collection or global.
 */
export async function localizeStatus(args: LocalizeStatusArgs): Promise<void> {
  const { collectionSlug, globalSlug, payload, req, session } = args

  if (!collectionSlug && !globalSlug) {
    throw new Error('Either collectionSlug or globalSlug must be provided')
  }

  if (collectionSlug && globalSlug) {
    throw new Error('Cannot provide both collectionSlug and globalSlug')
  }

  const entitySlug = collectionSlug || globalSlug
  // MongoDB collection names are case-insensitive and stored as lowercase
  const versionsCollection = `_${entitySlug}_versions`.toLowerCase()

  if (!payload.config.localization) {
    throw new Error('Localization is not enabled in payload config')
  }

  // Check if versions are enabled on this collection/global
  let entityConfig
  if (collectionSlug) {
    const collection = payload.config.collections.find((c) => c.slug === collectionSlug)
    if (collection) {
      entityConfig = collection
    }
  } else if (globalSlug) {
    const global = payload.config.globals.find((g) => g.slug === globalSlug)
    if (global) {
      entityConfig = global
    }
  }

  if (!entityConfig) {
    throw new Error(
      `${collectionSlug ? 'Collection' : 'Global'} not found: ${collectionSlug || globalSlug}`,
    )
  }

  payload.logger.info({
    msg: `Starting _status localization migration for ${collectionSlug ? 'collection' : 'global'}: ${entitySlug}`,
  })

  // Check if versions are enabled in config (skip if not)
  if (!entityConfig.versions) {
    payload.logger.info({
      msg: `Skipping migration for ${collectionSlug ? 'collection' : 'global'}: ${entitySlug} - versions not enabled`,
    })
    return
  }

  // Get MongoDB connection
  const connection = (payload.db as any).connection

  // Get filtered locales if filterAvailableLocales is defined
  let locales = payload.config.localization.localeCodes
  if (typeof payload.config.localization.filterAvailableLocales === 'function') {
    const filteredLocaleObjects = await payload.config.localization.filterAvailableLocales({
      locales: payload.config.localization.locales,
      req,
    })
    locales = filteredLocaleObjects.map((locale) => locale.code)
  }
  payload.logger.info({ msg: `Locales: ${locales.join(', ')}` })

  // Check if version._status exists and is NOT already localized
  const sampleDoc = await connection.collection(versionsCollection).findOne({}, { session })

  if (!sampleDoc) {
    payload.logger.info({ msg: 'No version documents found, nothing to migrate' })
    return
  }

  // Check if _status is already localized
  if (
    sampleDoc.version?._status &&
    typeof sampleDoc.version._status === 'object' &&
    !Array.isArray(sampleDoc.version._status)
  ) {
    payload.logger.info({
      msg: 'version._status is already localized, migration already completed',
    })
    return
  }

  // Validate that version._status exists and is a string
  if (
    !sampleDoc.version ||
    typeof sampleDoc.version._status !== 'string' ||
    Array.isArray(sampleDoc.version._status)
  ) {
    throw new Error(
      `Migration aborted: version._status field not found or has unexpected format in ${versionsCollection}. ` +
        `This migration should only run on schemas that have NOT yet been migrated to per-locale status.`,
    )
  }

  payload.logger.info({ msg: 'Fetching all version documents...' })

  // Get all versions, sorted chronologically
  const allVersions = await connection
    .collection(versionsCollection)
    .find({}, { session })
    .sort({ createdAt: 1, parent: 1 })
    .toArray()

  payload.logger.info({ msg: `Found ${allVersions.length} version documents` })

  // Transform MongoDB documents to VersionRecord format
  const versionRecords: VersionRecord[] = allVersions.map((doc: any) => ({
    id: doc._id.toString(),
    _status: doc.version._status as 'draft' | 'published',
    createdAt: doc.createdAt,
    parent: doc.parent?.toString(),
    publishedLocale: doc.publishedLocale,
    snapshot: doc.snapshot || false,
  }))

  // Calculate status per locale using shared logic
  const versionLocaleStatus = calculateVersionLocaleStatuses(versionRecords, locales, payload)

  payload.logger.info({ msg: 'Updating version documents with per-locale status...' })

  // Update each version document
  let updateCount = 0
  for (const doc of allVersions) {
    const versionId = doc._id.toString()
    const localeStatusMap = versionLocaleStatus.get(versionId)

    if (!localeStatusMap) {
      payload.logger.warn({ msg: `No status map found for version ${versionId}, skipping` })
      continue
    }

    // Build the new _status object: { en: 'published', es: 'draft', ... }
    const newStatus: Record<string, string> = {}
    for (const [locale, status] of localeStatusMap.entries()) {
      newStatus[locale] = status
    }

    // Update the document: change version._status from string to object
    await connection.collection(versionsCollection).updateOne(
      { _id: doc._id },
      {
        $set: {
          'version._status': newStatus,
        },
      },
      { session },
    )

    updateCount++
  }

  payload.logger.info({ msg: `Updated ${updateCount} version documents` })

  // Migrate main collection/global document _status to per-locale status object
  // Only if it has a status field
  if (collectionSlug) {
    const mainCollection = collectionSlug
    const mainDoc = await connection.collection(mainCollection).findOne({}, { session })

    if (mainDoc && '_status' in mainDoc) {
      payload.logger.info({ msg: `Migrating main collection documents for: ${mainCollection}` })

      const allDocs = await connection.collection(mainCollection).find({}, { session }).toArray()

      for (const doc of allDocs) {
        if (!doc._id) {
          continue
        }

        // Get the latest version for this document to determine status per locale
        const latestVersions = await connection
          .collection(versionsCollection)
          .find({ parent: doc._id }, { session })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()

        let statusObj: Record<string, string> = {}

        if (latestVersions.length > 0 && latestVersions[0]?.version?._status) {
          // Use the status from the latest version
          statusObj = latestVersions[0].version._status
        } else {
          // Fallback: set all locales to draft
          for (const locale of locales) {
            statusObj[locale] = 'draft'
          }
        }

        // Update main document
        await connection.collection(mainCollection).updateOne(
          { _id: doc._id },
          {
            $set: {
              _status: statusObj,
            },
          },
          { session },
        )
      }

      payload.logger.info({ msg: `Migrated ${allDocs.length} collection documents` })
    } else {
      payload.logger.info({
        msg: 'Skipping main document status migration (no status field found)',
      })
    }
  } else if (globalSlug) {
    // Globals are stored in a single 'globals' collection with globalType discriminator
    const globalDoc = await connection
      .collection('globals')
      .findOne({ globalType: globalSlug }, { session })
    if (globalDoc && '_status' in globalDoc && globalDoc._id) {
      payload.logger.info({ msg: `Migrating main global document for: ${globalSlug}` })

      // Get the latest version for the global
      const latestVersions = await connection
        .collection(versionsCollection)
        .find({}, { session })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

      let statusObj: Record<string, string> = {}

      if (latestVersions.length > 0 && latestVersions[0]?.version?._status) {
        statusObj = latestVersions[0].version._status
      } else {
        for (const locale of locales) {
          statusObj[locale] = 'draft'
        }
      }

      // Update global document
      await connection.collection('globals').updateOne(
        { _id: globalDoc._id, globalType: globalSlug },
        {
          $set: {
            _status: statusObj,
          },
        },
        { session },
      )

      payload.logger.info({ msg: 'Migrated global document' })
    } else {
      payload.logger.info({
        msg: 'Skipping main document status migration (no status field found)',
      })
    }
  }

  payload.logger.info({ msg: 'Migration completed successfully' })
}

async function cleanupSnapshotDocuments({
  connection,
  entitySlug,
  payload,
  session,
}: {
  connection: any
  entitySlug: string
  payload: Payload
  session?: ClientSession
}): Promise<void> {
  const versionsCollection = `_${entitySlug}_versions`.toLowerCase()

  const col = connection.collection(versionsCollection)

  // Delete all snapshot=true documents
  const deleteResult = await col.deleteMany({ snapshot: true }, { session })

  if (deleteResult.deletedCount > 0) {
    payload.logger.info({
      msg: `Deleted ${deleteResult.deletedCount} snapshot documents from ${versionsCollection}`,
    })
  }

  // Unset the snapshot field from remaining documents
  await col.updateMany({ snapshot: { $exists: true } }, { $unset: { snapshot: '' } }, { session })
}
