import type { PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getCollection } from './utilities/getEntity.js'

function getValueAtPath(doc: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((obj: any, key) => obj?.[key], doc)
}

const BATCH_SIZE = 1000

export async function migrateFieldDelocalized(
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

  payload.logger.warn(
    `[config-migration] Delocalizing field "${fieldPath}" on ${entity} "${slug}" — keeping only "${defaultLocale}" value`,
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
        if (
          currentValue !== null &&
          currentValue !== undefined &&
          typeof currentValue === 'object' &&
          !Array.isArray(currentValue)
        ) {
          const defaultValue = (currentValue as Record<string, unknown>)[defaultLocale] ?? null
          const update: Record<string, unknown> = {}
          update[fieldPath] = defaultValue
          await nativeCollection.updateOne({ _id: doc._id }, { $set: update })
        }
      }

      hasMore = docs.length === BATCH_SIZE
      page++
    }
  }

  payload.logger.info(
    `[config-migration] Done delocalizing field "${fieldPath}" on ${entity} "${slug}"`,
  )
}
