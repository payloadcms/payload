import type { GlobalAfterChangeHook } from 'payload/types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload } }) => {
  void revalidate({ type: 'tag', collection: 'header', payload, tag: 'global_header' })

  return doc
}
