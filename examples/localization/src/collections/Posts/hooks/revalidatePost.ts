import type { CollectionAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Config, Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, locale },
}) => {
  if (!locale && payload.config.localization) {
    locale = payload.config.localization.defaultLocale as Config['locale']
  }

  if (doc._status === 'published') {
    const path = `/${locale}/posts/${doc.slug}`

    payload.logger.info(`Revalidating post at path: ${path}`)

    revalidatePath(path)
  }

  // If the post was previously published, we need to revalidate the old path
  if (previousDoc._status === 'published' && doc._status !== 'published') {
    const oldPath = `/${locale}/posts/${previousDoc.slug}`

    payload.logger.info(`Revalidating old post at path: ${oldPath}`)

    revalidatePath(oldPath)
  }

  return doc
}
