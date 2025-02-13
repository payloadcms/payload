import type { CollectionAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Page } from '@payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = ({ doc, previousDoc, req }) => {
  if (req.context.skipRevalidate) {
    return doc
  }

  if (doc._status === 'published') {
    const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
    req.payload.logger.info(`Revalidating page at path: ${path}`)
    revalidatePath(path)
  }

  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`
    req.payload.logger.info(`Revalidating old page at path: ${oldPath}`)
    revalidatePath(oldPath)
  }

  return doc
}
