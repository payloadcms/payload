import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateMainMenu: GlobalAfterChangeHook = ({ doc, req, req: { payload } }) => {
  payload.logger.info(`Revalidating main menu`)

  if (req.context.skipRevalidate) {
    return doc
  }

  revalidateTag('global_main-menu')

  return doc
}
