import type { ClientSession } from 'mongoose'
import type { Payload, PayloadRequest } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getCollection, getGlobal } from '../utilities/getEntity.js'
import { getSession } from '../utilities/getSession.js'

export async function migrateVersionsV1_V2({ req }: { req: PayloadRequest }) {
  const { payload } = req

  const adapter = payload.db as MongooseAdapter
  const session = await getSession(adapter, req)

  // For each collection

  for (const { slug, versions } of payload.config.collections) {
    if (versions?.drafts) {
      await migrateCollectionDocs({ slug, adapter, payload, session })

      payload.logger.info(`Migrated the "${slug}" collection.`)
    }
  }

  // For each global
  for (const { slug, versions } of payload.config.globals) {
    if (versions) {
      const { Model } = getGlobal({
        adapter,
        globalSlug: slug,
        versions: true,
      })

      await Model.findOneAndUpdate(
        {},
        { latest: true },
        {
          session,
          sort: { updatedAt: -1 },
        },
      ).exec()

      payload.logger.info(`Migrated the "${slug}" global.`)
    }
  }
}

async function migrateCollectionDocs({
  slug,
  adapter,
  docsAtATime = 100,
  payload,
  session,
}: {
  adapter: MongooseAdapter
  docsAtATime?: number
  payload: Payload
  session?: ClientSession
  slug: string
}) {
  const { Model } = getCollection({
    adapter,
    collectionSlug: slug,
    versions: true,
  })
  const remainingDocs = await Model.aggregate(
    [
      // Sort so that newest are first
      {
        $sort: {
          updatedAt: -1,
        },
      },
      // Group by parent ID
      // take the $first of each
      {
        $group: {
          _id: '$parent',
          _versionID: { $first: '$_id' },
          createdAt: { $first: '$createdAt' },
          latest: { $first: '$latest' },
          updatedAt: { $first: '$updatedAt' },
          version: { $first: '$version' },
        },
      },
      {
        $match: {
          latest: { $eq: null },
        },
      },
      {
        $limit: docsAtATime,
      },
    ],
    {
      allowDiskUse: true,
      session,
    },
  ).exec()

  if (!remainingDocs || remainingDocs.length === 0) {
    const newVersions = await Model.find(
      {
        latest: {
          $eq: true,
        },
      },
      undefined,
      { session },
    )

    if (newVersions?.length) {
      payload.logger.info(
        `Migrated ${newVersions.length} documents in the "${slug}" versions collection.`,
      )
    }

    return
  }

  const remainingDocIDs = remainingDocs.map((doc) => doc._versionID)

  await Model.updateMany(
    {
      _id: {
        $in: remainingDocIDs,
      },
    },
    {
      latest: true,
    },
    {
      session,
    },
  )

  await migrateCollectionDocs({ slug, adapter, payload, session })
}
