import type { DefaultDocumentIDType, Locale } from '../index.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { isolateObjectProperty } from './isolateObjectProperty.js'

export type DocumentMatchingWhereExistsArgs = {
  collection: string
  /**
   * When true, also matches documents whose value only exists in a draft version. A versioned
   * collection keeps draft data in `_versions`, which the main-collection query — and the unique
   * index — would miss.
   */
  draftsEnabled?: boolean
  /** Exclude this document, so a document does not conflict with itself on update. */
  id?: DefaultDocumentIDType
  locale?: Locale['code']
  overrideAccess?: boolean
  req: PayloadRequest
  where: Where
}

/** Whether another document in `collection` matches `where`. */
export const documentMatchingWhereExists = async ({
  id,
  collection,
  draftsEnabled,
  locale,
  overrideAccess = false,
  req,
  where,
}: DocumentMatchingWhereExistsArgs): Promise<boolean> => {
  const includeTrashed = Boolean(req.payload.collections[collection]?.config.trash)

  // Drafts can replace a field's value while the stored row still reserves the old value
  // in a unique index. Check both representations before treating a value as available.
  for (const draft of draftsEnabled ? [false, true] : [false]) {
    const queryReq = isolateObjectProperty(req, ['query', 'transactionID'])

    queryReq.query = { ...req.query }
    delete queryReq.transactionID

    const { docs } = await req.payload.find({
      collection,
      depth: 0,
      disableErrors: true,
      draft,
      limit: 2,
      locale,
      overrideAccess,
      pagination: false,
      req: queryReq,
      trash: includeTrashed,
      where,
    })

    if (docs.some((doc) => doc.id !== id)) {
      return true
    }
  }

  return false
}
