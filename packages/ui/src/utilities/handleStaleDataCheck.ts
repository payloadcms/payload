import type { PayloadRequest } from 'payload'

import { hasDraftsEnabled } from 'payload/shared'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  originalUpdatedAt: string
  req: PayloadRequest
}

type Result = {
  currentUpdatedAt: string
  isStale: boolean
}

export const handleStaleDataCheck = async ({
  id,
  collectionSlug,
  globalSlug,
  originalUpdatedAt,
  req,
}: Args): Promise<Result> => {
  let currentUpdatedAt: string
  let draftUpdatedAt: string
  let publishedUpdatedAt: string

  try {
    if (collectionSlug && id) {
      const collection = req.payload.config.collections.find((c) => c.slug === collectionSlug)
      const collectionHasDrafts = collection ? hasDraftsEnabled(collection) : false

      const [draftDoc, publishedDoc] = await Promise.all([
        req.payload.findByID({
          id,
          collection: collectionSlug,
          depth: 0,
          draft: collectionHasDrafts,
          overrideAccess: false,
          select: {
            updatedAt: true,
          },
          user: req.user,
        }),
        collectionHasDrafts
          ? req.payload.findByID({
              id,
              collection: collectionSlug,
              depth: 0,
              draft: false,
              overrideAccess: false,
              select: {
                updatedAt: true,
              },
              user: req.user,
            })
          : Promise.resolve(null),
      ])

      draftUpdatedAt = draftDoc?.updatedAt as string
      publishedUpdatedAt = publishedDoc?.updatedAt as string
      currentUpdatedAt = draftUpdatedAt || publishedUpdatedAt
    } else if (globalSlug) {
      const global = req.payload.config.globals.find((g) => g.slug === globalSlug)
      const globalHasDrafts = global ? hasDraftsEnabled(global) : false

      const [draftGlobal, publishedGlobal] = await Promise.all([
        req.payload.findGlobal({
          slug: globalSlug,
          depth: 0,
          draft: globalHasDrafts,
          overrideAccess: false,
          select: {
            updatedAt: true,
          },
          user: req.user,
        }),
        globalHasDrafts
          ? req.payload.findGlobal({
              slug: globalSlug,
              depth: 0,
              draft: false,
              overrideAccess: false,
              select: {
                updatedAt: true,
              },
              user: req.user,
            })
          : Promise.resolve(null),
      ])

      draftUpdatedAt = draftGlobal?.updatedAt as string
      publishedUpdatedAt = publishedGlobal?.updatedAt as string
      currentUpdatedAt = draftUpdatedAt || publishedUpdatedAt
    }

    // Compare timestamps
    const matchesDraft = draftUpdatedAt && draftUpdatedAt === originalUpdatedAt
    const matchesPublished = publishedUpdatedAt && publishedUpdatedAt === originalUpdatedAt
    const isStale = currentUpdatedAt && !matchesDraft && !matchesPublished

    return {
      currentUpdatedAt,
      isStale: Boolean(isStale),
    }
  } catch (err) {
    // If we can't fetch the document, assume it's not stale
    req.payload.logger.error({ err, msg: 'Error checking for stale data' })
    return {
      currentUpdatedAt: originalUpdatedAt,
      isStale: false,
    }
  }
}
