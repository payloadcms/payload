import type { Payload } from '../../../../types/index.js'

import { hasLocalizeStatusEnabled } from '../../../../utilities/getVersionsConfig.js'

export type LocalizeStatusArgs = {
  collectionSlug?: string
  globalSlug?: string
  payload: Payload
  req?: any
}

export async function down(args: LocalizeStatusArgs): Promise<void> {
  const { collectionSlug, globalSlug, payload } = args

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

  const entityConfig = collectionSlug
    ? payload.config.collections.find((c) => c.slug === collectionSlug)
    : payload.config.globals.find((g) => g.slug === globalSlug!)

  if (!entityConfig) {
    throw new Error(
      `${collectionSlug ? 'Collection' : 'Global'} not found: ${collectionSlug || globalSlug}`,
    )
  }

  if (hasLocalizeStatusEnabled(entityConfig)) {
    throw new Error(
      `${entitySlug} has localizeStatus enabled, cannot run down migration. ` +
        `Please disable localizeStatus in your config before rolling back this migration.`,
    )
  }

  const defaultLocale = payload.config.localization.defaultLocale

  payload.logger.info({
    msg: `Rolling back _status localization migration for ${collectionSlug ? 'collection' : 'global'}: ${entitySlug}`,
  })

  // Get MongoDB connection
  const connection = (payload.db as any).connection

  payload.logger.info({ msg: 'Fetching all version documents...' })

  // Get all versions
  const allVersions = await connection.collection(versionsCollection).find({}).toArray()

  payload.logger.info({ msg: `Found ${allVersions.length} version documents` })

  // Update each version document: convert version._status from object to string
  let updateCount = 0
  for (const doc of allVersions) {
    const currentStatus = doc.version?._status

    if (!currentStatus || typeof currentStatus === 'string') {
      // Already rolled back or never migrated
      continue
    }

    // Convert from { en: 'published', es: 'draft' } to 'published' (using default locale)
    const statusValue =
      typeof currentStatus === 'object' ? currentStatus[defaultLocale] || 'draft' : 'draft'

    await connection.collection(versionsCollection).updateOne(
      { _id: doc._id },
      {
        $set: {
          'version._status': statusValue,
        },
      },
    )

    updateCount++
  }

  payload.logger.info({ msg: `Updated ${updateCount} version documents` })

  // Rollback main collection/global document status
  if (collectionSlug) {
    const mainCollection = collectionSlug
    const mainDoc = await connection.collection(mainCollection).findOne({})

    if (mainDoc && '_status' in mainDoc && typeof mainDoc._status === 'object') {
      payload.logger.info({ msg: `Rolling back main collection documents for: ${mainCollection}` })

      const allDocs = await connection.collection(mainCollection).find({}).toArray()

      for (const doc of allDocs) {
        if (typeof doc._status === 'object' && !Array.isArray(doc._status)) {
          // Convert from { en: 'published', es: 'draft' } to 'published' (using default locale)
          const statusValue = doc._status[defaultLocale] || 'draft'

          await connection.collection(mainCollection).updateOne(
            { _id: doc._id },
            {
              $set: {
                _status: statusValue,
              },
            },
          )
        }
      }

      payload.logger.info({ msg: `Rolled back ${allDocs.length} collection documents` })
    }
  } else if (globalSlug) {
    const globalDoc = await connection.collection('globals').findOne({ globalType: globalSlug })

    if (globalDoc && '_status' in globalDoc && typeof globalDoc.status === 'object') {
      payload.logger.info({ msg: `Rolling back main global document for: ${globalSlug}` })

      // Convert from { en: 'published', es: 'draft' } to 'published' (using default locale)
      const statusValue =
        typeof globalDoc._status === 'object' && !Array.isArray(globalDoc._status)
          ? globalDoc._status[defaultLocale] || 'draft'
          : 'draft'

      await connection.collection('globals').updateOne(
        { _id: globalDoc._id, globalType: globalSlug },
        {
          $set: {
            _status: statusValue,
          },
        },
      )

      payload.logger.info({ msg: 'Rolled back global document' })
    }
  }

  payload.logger.info({ msg: 'Rollback completed successfully' })
}
