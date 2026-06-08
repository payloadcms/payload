import type { PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getCollection } from './utilities/getEntity.js'

function getValueAtPath(doc: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((obj: any, key) => obj?.[key], doc)
}

const BATCH_SIZE = 1000

export async function migrateFieldLocalized(
  this: MongooseAdapter,
  args: {
    defaultLocale: string
    entity: 'collection' | 'global'
    fieldPath: string
    req: PayloadRequest
    slug: string
  },
): Promise<void> {
  const { slug, defaultLocale, entity, fieldPath } = args
  const { payload } = this

  payload.logger.info(
    `[config-migration] Localizing field "${fieldPath}" on ${entity} "${slug}" → locale "${defaultLocale}"`,
  )

  if (entity === 'collection') {
    const { Model } = getCollection({ adapter: this, collectionSlug: slug })
    const nativeCollection = Model.collection

    let page = 1
    let hasMore = true

    while (hasMore) {
      const docs = await nativeCollection
        .find({})
        .skip((page - 1) * BATCH_SIZE)
        .limit(BATCH_SIZE)
        .toArray()

      for (const doc of docs) {
        const currentValue = getValueAtPath(doc as any, fieldPath)
        // Skip if already in localized shape
        if (
          currentValue !== null &&
          currentValue !== undefined &&
          typeof currentValue === 'object' &&
          !Array.isArray(currentValue)
        ) {
          continue
        }
        const update: Record<string, unknown> = {}
        update[fieldPath] = { [defaultLocale]: currentValue }
        await nativeCollection.updateOne({ _id: doc._id }, { $set: update })
      }

      hasMore = docs.length === BATCH_SIZE
      page++
    }
  }

  payload.logger.info(
    `[config-migration] Done localizing field "${fieldPath}" on ${entity} "${slug}"`,
  )
}
