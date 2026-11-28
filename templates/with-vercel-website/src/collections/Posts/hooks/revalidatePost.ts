import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

// `previousDoc` in `afterChange` is the latest version, which is a draft when the post has
// unpublished changes, so it can't tell whether the post was live. Before a write that can take
// the post offline (neither a publish nor a draft save), record the slug of the published post.
export const recordPublishedPost: CollectionBeforeChangeHook<Post> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const { context, payload, query } = req

  if (
    !context.disableRevalidate &&
    operation === 'update' &&
    originalDoc?.id &&
    data._status !== 'published' &&
    query?.draft !== 'true'
  ) {
    const livePost = await payload.findByID({
      id: originalDoc.id,
      collection: 'posts',
      depth: 0,
      draft: false,
      overrideAccess: true,
      req,
      select: { _status: true, slug: true },
    })

    if (livePost?._status === 'published') {
      // Read `req.context` again: the nested `findByID` call replaces it with a copy.
      const publishedSlugs = (req.context.publishedPostSlugs ??= {}) as Record<string, string>
      publishedSlugs[String(originalDoc.id)] = livePost.slug
    }
  }

  return data
}

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({ doc, req }) => {
  const { context, payload } = req

  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateTag('posts-sitemap', 'max')
    }

    // If this write took a published post offline, revalidate the path it was published at
    const publishedSlug = (context.publishedPostSlugs as Record<string, string> | undefined)?.[
      String(doc.id)
    ]

    if (publishedSlug !== undefined && doc._status !== 'published') {
      // A draft save leaves the published post live. The Local API's `draft: true` doesn't set
      // `req.query.draft`, so check the live post again before treating this as an unpublish.
      const livePost = await payload.findByID({
        id: doc.id,
        collection: 'posts',
        depth: 0,
        draft: false,
        overrideAccess: true,
        req,
        select: { _status: true },
      })

      if (livePost?._status !== 'published') {
        const oldPath = `/posts/${publishedSlug}`

        payload.logger.info(`Revalidating old post at path: ${oldPath}`)

        revalidatePath(oldPath)
        revalidateTag('posts-sitemap', 'max')
      }
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    revalidatePath(path)
    revalidateTag('posts-sitemap', 'max')
  }

  return doc
}
