import type { CollectionAfterChangeHook } from 'payload/types'

import type { Page } from '../../../../payload-types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidatePage: CollectionAfterChangeHook<Page> = ({ doc, req: { payload } }) => {
  if (doc._status === 'published') {
    const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
    void revalidate({ collection: 'pages', path, payload })
  }

  return doc
}
