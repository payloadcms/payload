import type { GlobalAfterChangeHook } from 'payload'

import { revalidateHeaderTag } from '@/app/actions/revalidate'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    revalidateHeaderTag().catch(console.error)
  }

  return doc
}
