import { revalidateTag } from 'next/cache'
import type { GlobalAfterChangeHook } from 'payload'

export const revalidateHeader: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)
    revalidateTag('global_header', 'max')
  }

  return doc
}
