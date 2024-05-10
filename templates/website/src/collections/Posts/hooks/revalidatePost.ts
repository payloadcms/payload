import type { CollectionAfterChangeHook } from 'payload/types'

import { revalidate } from '../../../utilities/revalidate'

// Revalidate the post in the background, so the user doesn't have to wait
// Notice that the hook itself is not async and we are not awaiting `revalidate`
// Only revalidate existing docs that are published
// Don't scope to `operation` in order to purge static demo posts
export const revalidatePost: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  if (doc._status === 'published') {
    void revalidate({ slug: doc.slug, collection: 'posts', payload })
  }

  return doc
}
