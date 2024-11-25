import type { CollectionAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Page } from '../../../payload-types'

// ensure that the home page is revalidated at '/' instead of '/home'
export const formatAppURL = ({ doc }): string => {
  const pathToUse = doc.slug === 'home' ? '' : doc.slug
  const { pathname } = new URL(`${process.env.PAYLOAD_PUBLIC_SITE_URL}/${pathToUse}`)
  return pathname
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const isRevalidateRouteEnabled =
    process.env.PAYLOAD_PUBLIC_SITE_URL && process.env.REVALIDATION_KEY

  if (isRevalidateRouteEnabled) {
    // Logic for external revalidation
    if (operation === 'update' && doc._status === 'published') {
      const url = formatAppURL({ doc })

      const revalidate = async (): Promise<void> => {
        try {
          const res = await fetch(
            `${process.env.PAYLOAD_PUBLIC_SITE_URL}/api/revalidate?secret=${process.env.REVALIDATION_KEY}&collection=pages&slug=${doc?.slug}&path=${url}`,
          )

          if (res.ok) {
            req.payload.logger.info(`Revalidated path ${url}`)
          } else {
            req.payload.logger.error(`Error revalidating path ${url}`)
          }
        } catch (err: unknown) {
          req.payload.logger.error(`Error hitting revalidate route for ${url}`)
        }
      }

      void revalidate()
    }
  } else {
    // Logic for local revalidation
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
  }

  return doc
}
