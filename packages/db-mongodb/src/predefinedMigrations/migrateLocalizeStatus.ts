import type { Payload, PayloadRequest } from 'payload'

import { localizeStatus } from 'payload/migrations'

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

  for (const collection of collections) {
    await localizeStatus.up({ collectionSlug: collection.slug, payload, req })
    await _cleanupSnapshotDocuments({ connection, entitySlug: collection.slug, payload })
  }

  for (const global of globals) {
    await localizeStatus.up({ globalSlug: global.slug, payload, req })
    await _cleanupSnapshotDocuments({ connection, entitySlug: global.slug, payload })
  }

  payload.logger.info({ msg: 'localize-status migration completed successfully' })
}

async function _cleanupSnapshotDocuments({
  connection,
  entitySlug,
  payload,
}: {
  connection: any
  entitySlug: string
  payload: Payload
}): Promise<void> {
  const versionsCollection = `_${entitySlug}_versions`.toLowerCase()

  const col = connection.collection(versionsCollection)

  // Delete all snapshot=true documents
  const deleteResult = await col.deleteMany({ snapshot: true })

  if (deleteResult.deletedCount > 0) {
    payload.logger.info({
      msg: `Deleted ${deleteResult.deletedCount} snapshot documents from ${versionsCollection}`,
    })
  }

  // Unset the snapshot field from remaining documents
  await col.updateMany({ snapshot: { $exists: true } }, { $unset: { snapshot: '' } })
}
