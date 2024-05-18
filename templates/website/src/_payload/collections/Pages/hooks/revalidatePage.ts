import type { CollectionAfterChangeHook } from 'payload/types'

import type { Page } from '../../../../payload-types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidatePage: CollectionAfterChangeHook<Page> = ({ doc, req: { payload } }) => {
  if (doc._status === 'published') {
    void revalidate({ collection: 'pages', path: `/${doc.slug}`, payload })
  }

  return doc
}
