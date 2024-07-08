import type { GlobalAfterChangeHook } from 'payload'

import { revalidate } from '../../../utilities/revalidate'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload } }) => {
  void revalidate({ type: 'tag', collection: 'header', payload, tag: 'global_header' })

  return doc
}
