import type { ReleaseMigrationLock, TryAcquireMigrationLock } from 'payload'

import type { MongooseAdapter } from './index.js'

const lockSlug = 'payload-migrations-lock'

export const tryAcquireMigrationLock: TryAcquireMigrationLock = async function (
  this: MongooseAdapter,
  { instanceId, timeout },
) {
  const collection = this.globals.collection

  // Globals share a collection. Enforce singleton identity even when auto-indexing is disabled.
  await collection.createIndex(
    { globalType: 1 },
    {
      name: 'payload_migrations_lock_singleton',
      partialFilterExpression: { globalType: lockSlug },
      unique: true,
    },
  )

  try {
    await collection.updateOne(
      { globalType: lockSlug },
      { $setOnInsert: { createdAt: new Date(), lock_key: lockSlug, locked: false } },
      { upsert: true },
    )
  } catch (err) {
    // Concurrent insertion of the same singleton is benign; all other failures propagate.
    if (!err || typeof err !== 'object' || !('code' in err) || err.code !== 11000) {
      throw err
    }
    if (!(await collection.findOne({ globalType: lockSlug }))) {
      throw err instanceof Error
        ? err
        : new Error('Migration lock initialization failed', { cause: err })
    }
  }

  const result = await collection.findOneAndUpdate(
    {
      $or: [
        { locked: { $ne: true } },
        { $expr: { $lte: ['$expires_at', '$$NOW'] }, expires_at: { $type: 'date' } },
      ],
      globalType: lockSlug,
    },
    [
      {
        $set: {
          expires_at: { $add: ['$$NOW', timeout] },
          locked: true,
          locked_at: '$$NOW',
          locked_by: { $literal: instanceId },
          updatedAt: '$$NOW',
        },
      },
    ],
    { returnDocument: 'after' },
  )

  return { acquired: result !== null }
}

export const releaseMigrationLock: ReleaseMigrationLock = async function (
  this: MongooseAdapter,
  { instanceId },
) {
  await this.globals.collection.updateOne(
    { globalType: lockSlug, locked_by: instanceId },
    { $set: { locked: false } },
  )
}
