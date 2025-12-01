import type { CollectionAfterChangeHook } from 'payload'

import { revalidateRedirects as revalidateRedirectsAction } from '@/app/actions/revalidate'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info(`Revalidating redirects`)

  revalidateRedirectsAction().catch(console.error)

  return doc
}
