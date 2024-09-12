import type { JsonObject, PaginatedDocs, Payload, PayloadRequest } from 'payload'

import { exportsCollectionSlug, exportsUploadsCollectionSlug } from '../constants.js'

/**
 * Export function that gets all data across all collections and writes to an exports collection
 */

export const exportData = async ({ payload }: { payload: Payload }) => {
  const collectionSlugs = payload.config.collections.map((c) => c.slug)

  if (!collectionSlugs.length) {
    payload.logger.warn('No collections found to export.')
    return
  }

  payload.logger.info(
    `Exporting data from collections: ${collectionSlugs.filter((slug) => [exportsCollectionSlug, exportsUploadsCollectionSlug].includes(slug)).join(', ')}`,
  )

  const promiseMap: Record<string, Promise<JsonObject | PaginatedDocs['docs']>> = {}

  const globalSlugs = payload.config.globals.map((g) => g.slug)

  globalSlugs.forEach((globalSlug) => {
    promiseMap[globalSlug] = payload.db.findGlobal({
      slug: globalSlug,
      req: {} as PayloadRequest,
    })
  })

  collectionSlugs.forEach((slug) => {
    if ([exportsCollectionSlug, exportsUploadsCollectionSlug].includes(slug)) {
      return
    }

    promiseMap[slug] = payload.db
      .find({
        collection: slug,
        limit: 1000,
        req: {} as PayloadRequest,
      })
      .then((res) => res.docs)
  })

  const collectionExports = await Promise.all(
    Object.entries(promiseMap).map(async ([slug, promise]) => {
      const docsOrDoc = await promise
      return {
        slug,
        data: docsOrDoc,
      }
    }),
  )

  payload.logger.info({ collectionExports })

  // Convert

  const created = await payload.create({
    collection: exportsCollectionSlug,
    data: {
      collectionExports,
    },
  })

  payload.logger.info({ created })
}
