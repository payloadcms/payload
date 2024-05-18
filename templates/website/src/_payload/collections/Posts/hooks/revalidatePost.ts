import type { CollectionAfterChangeHook } from 'payload/types'

import type { Post } from '../../../../payload-types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({ doc, req: { payload } }) => {
  if (doc._status === 'published') {
    void revalidate({ collection: 'posts', path: `/posts/${doc.slug}`, payload })
  }

  return doc
}
