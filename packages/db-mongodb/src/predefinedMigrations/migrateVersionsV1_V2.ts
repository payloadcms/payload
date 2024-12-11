import type { ClientSession } from 'mongoose'
import type { Payload, PayloadRequest } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getSession } from '../getSession.js'

export async function migrateVersionsV1_V2({ req }: { req: PayloadRequest }) {
  const { payload } = req

  const session = await getSession(payload.db as MongooseAdapter, req)

  // For each collection

  for (const { slug, versions } of payload.config.collections) {
    if (versions?.drafts) {
      await migrateCollectionDocs({ slug, payload, session })

      payload.logger.info(`Migrated the "${slug}" collection.`)
    }
  }

  // For each global
  for (const { slug, versions } of payload.config.globals) {
    if (versions) {
      const VersionsModel = payload.db.versions[slug]

      await VersionsModel.findOneAndUpdate(
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
  docsAtATime = 100,
  payload,
  session,
}: {
  docsAtATime?: number
  payload: Payload
  session: ClientSession
  slug: string
}) {
  const VersionsModel = payload.db.versions[slug]
  const remainingDocs = await VersionsModel.aggregate(
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
    const newVersions = await VersionsModel.find(
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

  const remainingDocIds = remainingDocs.map((doc) => doc._versionID)

  await VersionsModel.updateMany(
    {
      _id: {
        $in: remainingDocIds,
      },
    },
    {
      latest: true,
    },
    {
      session,
    },
  )

  await migrateCollectionDocs({ slug, payload, session })
}
