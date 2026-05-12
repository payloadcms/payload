import type { PayloadRequest } from 'payload'

import { batchTransform } from 'payload/migrations'

import type { DrizzleAdapter } from './types.js'

const BATCH_SIZE = 1000

export async function migrateVersionsEnabled(
  this: DrizzleAdapter,
  args: {
    entity: 'collection' | 'global'
    initialStatus: 'draft' | 'published'
    req: PayloadRequest
    slug: string
  },
): Promise<void> {
  const { slug, entity, initialStatus, req } = args
  const { payload } = this

  payload.logger.info(
    `[config-migration] Creating version entries for existing ${entity} "${slug}" with _status: ${initialStatus}`,
  )

  if (entity === 'collection') {
    await batchTransform({
      batchSize: BATCH_SIZE,
      fetcher: ({ limit, page }: { limit: number; page: number }) =>
        payload.db.find({ collection: slug, limit, page, pagination: true, req }),
      transform: async (doc: any) => {
        await payload.db.createVersion({
          autosave: false,
          collectionSlug: slug as any,
          createdAt: doc.createdAt ?? new Date().toISOString(),
          parent: doc.id,
          req,
          updatedAt: doc.updatedAt ?? new Date().toISOString(),
          versionData: { ...doc, _status: initialStatus },
        })
      },
    })
  } else {
    const globalDoc = await payload.db.findGlobal({ slug, req })
    await payload.db.createGlobalVersion({
      autosave: false,
      createdAt: globalDoc.createdAt ?? new Date().toISOString(),
      globalSlug: slug as any,
      req,
      updatedAt: globalDoc.updatedAt ?? new Date().toISOString(),
      versionData: { ...globalDoc, _status: initialStatus },
    })
  }

  payload.logger.info(`[config-migration] Done creating version entries for "${slug}"`)
}
