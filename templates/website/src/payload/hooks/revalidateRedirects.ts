import type { CollectionAfterChangeHook } from 'payload'

import { revalidate } from '../utilities/revalidate'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  void revalidate({ type: 'tag', collection: 'redirects', payload, tag: `redirects` })

  return doc
}
