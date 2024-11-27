import type { CollectionAfterChangeHook } from 'payload'

import { revalidate } from '@/utilities/revalidate'

// Revalidate the page in the background, so the user doesn't have to wait
// Notice that the hook itself is not async and we are not awaiting `revalidate`
// Only revalidate existing docs that are published
// Don't scope to `operation` in order to purge static demo pages
export const revalidatePage: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  if (doc._status === 'published') {
    revalidate({ slug: doc.slug, collection: 'pages', payload })
  }

  return doc
}
