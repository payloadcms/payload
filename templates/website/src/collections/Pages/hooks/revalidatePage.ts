import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req,
}) => {
  const { context, payload } = req

  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = await payload.generateFrontendPath({ collection: 'pages', doc, req })

      if (path) {
        payload.logger.info(`Revalidating page at path: ${path}`)

        revalidatePath(path)
      }
      revalidateTag('pages-sitemap', 'max')
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = await payload.generateFrontendPath({
        collection: 'pages',
        doc: previousDoc,
        req,
      })

      if (oldPath) {
        payload.logger.info(`Revalidating old page at path: ${oldPath}`)

        revalidatePath(oldPath)
      }
      revalidateTag('pages-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = async ({ doc, req }) => {
  if (!req.context.disableRevalidate) {
    const path = await req.payload.generateFrontendPath({ collection: 'pages', doc, req })

    if (path) {
      revalidatePath(path)
    }
    revalidateTag('pages-sitemap', 'max')
  }

  return doc
}
