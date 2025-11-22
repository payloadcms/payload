import type { GlobalAfterChangeHook } from 'payload'

import { revalidateFooterTag } from '@/app/actions/revalidate'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    revalidateFooterTag().catch(console.error)
  }

  return doc
}
