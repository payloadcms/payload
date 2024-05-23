import type { GlobalAfterChangeHook } from 'payload/types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload } }) => {
  void revalidate({ type: 'tag', collection: 'footer', payload, tag: 'global_footer' })

  return doc
}
