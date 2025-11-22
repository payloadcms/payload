import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePage as revalidatePageAction } from '@/app/actions/revalidate'

import type { Page } from '../../../payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '' : doc.slug

      payload.logger.info(`Revalidating page at path: /${path}`)

      revalidatePageAction(path).catch(console.error)
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '' : previousDoc.slug

      payload.logger.info(`Revalidating old page at path: /${oldPath}`)

      revalidatePageAction(oldPath).catch(console.error)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '' : doc?.slug || ''
    revalidatePageAction(path).catch(console.error)
  }

  return doc
}
