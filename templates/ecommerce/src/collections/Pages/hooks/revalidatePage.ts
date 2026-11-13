import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'

// `previousDoc` in `afterChange` is the latest version, which is a draft when the page has
// unpublished changes, so it can't tell whether the page was live. Before a write that can take
// the page offline (neither a publish nor a draft save), record the slug of the published page.
export const recordPublishedPage: CollectionBeforeChangeHook<Page> = async ({
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
    const livePage = await payload.findByID({
      id: originalDoc.id,
      collection: 'pages',
      depth: 0,
      draft: false,
      overrideAccess: true,
      req,
      select: { _status: true, slug: true },
    })

    if (livePage?._status === 'published') {
      // Read `req.context` again: the nested `findByID` call replaces it with a copy.
      const publishedSlugs = (req.context.publishedPageSlugs ??= {}) as Record<string, string>
      publishedSlugs[String(originalDoc.id)] = livePage.slug
    }
  }

  return data
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`

      payload.logger.info(`Revalidating page at path: ${path}`)

      revalidatePath(path)
      //revalidateTag('pages-sitemap', 'max')
    }

    // If this write took a published page offline, revalidate the path it was published at
    const publishedSlug = (context.publishedPageSlugs as Record<string, string> | undefined)?.[
      String(doc.id)
    ]

    if (publishedSlug !== undefined && doc._status !== 'published') {
      const oldPath = publishedSlug === 'home' ? '/' : `/${publishedSlug}`

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      revalidatePath(oldPath)
      //revalidateTag('pages-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
    revalidatePath(path)
    //revalidateTag('pages-sitemap', 'max')
  }

  return doc
}
