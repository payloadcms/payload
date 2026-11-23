import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
}) => {
  const { context, payload } = req

  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = await payload.generateFrontendPath({ collection: 'posts', doc, req })

      if (path) {
        payload.logger.info(`Revalidating post at path: ${path}`)

        revalidatePath(path)
      }
      revalidateTag('posts-sitemap', 'max')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = await payload.generateFrontendPath({
        collection: 'posts',
        doc: previousDoc,
        req,
      })

      if (oldPath) {
        payload.logger.info(`Revalidating old post at path: ${oldPath}`)

        revalidatePath(oldPath)
      }
      revalidateTag('posts-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req }) => {
  if (!req.context.disableRevalidate) {
    const path = await req.payload.generateFrontendPath({ collection: 'posts', doc, req })

    if (path) {
      revalidatePath(path)
    }
    revalidateTag('posts-sitemap', 'max')
  }

  return doc
}
