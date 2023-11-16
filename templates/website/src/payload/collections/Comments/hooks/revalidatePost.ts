import type { AfterChangeHook } from 'payload/dist/collections/config/types'

import { revalidate } from '../../../utilities/revalidate'

// Revalidate the post that is associated with this comment
export const revalidatePost: AfterChangeHook = async ({ doc: commentDoc, req: { payload } }) => {
  if (commentDoc._status === 'published' && commentDoc.doc) {
    // lookup the full parent doc to get the slug
    if (typeof commentDoc.doc === 'string') {
      const parentDoc = await payload.findByID({
        collection: 'posts',
        id: commentDoc.doc,
        depth: 0,
      })

      if (parentDoc) {
        revalidate({ payload, collection: 'posts', slug: parentDoc.slug })
      } else {
        payload.logger.error(
          `Parent doc for comment '${commentDoc.id}' was not found, could not revalidate`,
        )
      }
    }
  }

  return commentDoc
}
