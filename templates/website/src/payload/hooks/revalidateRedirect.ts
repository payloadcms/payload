import type { CollectionAfterChangeHook } from 'payload'

import { revalidate } from '../utilities/revalidate'

export const revalidateRedirect: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  void revalidate({ type: 'tag', collection: 'redirects', payload, tag: `redirects_${doc.from}` })

  return doc
}
