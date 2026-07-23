import type { PayloadRequest } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getCollection } from '../utilities/getEntity.js'
import { getSession } from '../utilities/getSession.js'

export async function migrateJobsProcessingLease({
  direction,
  req,
}: {
  direction: 'down' | 'up'
  req: PayloadRequest
}): Promise<void> {
  const adapter = req.payload.db as MongooseAdapter
  const { Model } = getCollection({ adapter, collectionSlug: 'payload-jobs' })
  const session = await getSession(adapter, req)
  const indexes = await Model.collection.indexes({ session })

  if (direction === 'up') {
    await Model.collection.updateMany(
      { processing: true },
      { $set: { processingUntil: new Date(0) } },
      { session },
    )
    await Model.collection.updateMany({}, { $unset: { processing: '' } }, { session })

    const processingIndex = indexes.find((index) => index.key.processing === 1)
    if (processingIndex?.name) {
      await Model.collection.dropIndex(processingIndex.name, { session })
    }

    await Model.collection.createIndex({ processingUntil: 1 }, { session })

    return
  }

  await Model.collection.updateMany({}, { $set: { processing: false } }, { session })
  await Model.collection.updateMany(
    { processingUntil: { $ne: null } },
    { $set: { processing: true } },
    { session },
  )
  await Model.collection.updateMany(
    {},
    { $unset: { processingToken: '', processingUntil: '' } },
    { session },
  )

  const processingUntilIndex = indexes.find((index) => index.key.processingUntil === 1)
  if (processingUntilIndex?.name) {
    await Model.collection.dropIndex(processingUntilIndex.name, { session })
  }

  await Model.collection.createIndex({ processing: 1 }, { session })
}
