import type { DefaultDocumentIDType, Locale } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { isolateObjectProperty } from './isolateObjectProperty.js'

type Args = {
  collection: string
  /**
   * When true, also matches documents whose value only exists in a draft version. A versioned
   * collection keeps draft data in `_versions`, which the main-collection query — and the unique
   * index — would miss.
   */
  draftsEnabled?: boolean
  field: string
  /** Exclude this document, so a doc doesn't conflict with itself on update. */
  id?: DefaultDocumentIDType
  locale?: Locale['code']
  overrideAccess?: boolean
  req: PayloadRequest
  value: unknown
}

/**
 * Whether another document in `collection` already uses `value` for `field`.
 *
 * Runs the `find` operation outside the caller's transaction while preserving the rest of the
 * request. A committed read is what a uniqueness check wants, and isolating the transaction avoids
 * the "cursor on a session with a transaction in progress" error from a hook. `draft` includes
 * slugs that only exist in a draft version.
 */
export const fieldValueExists = async ({
  id,
  collection,
  draftsEnabled,
  field,
  locale,
  overrideAccess = true,
  req,
  value,
}: Args): Promise<boolean> => {
  const queryReq = isolateObjectProperty(req, ['query', 'transactionID'])
  queryReq.query = { ...req.query }
  delete queryReq.transactionID

  const { docs } = await req.payload.find({
    collection,
    depth: 0,
    disableErrors: true,
    draft: Boolean(draftsEnabled),
    limit: 2,
    locale: locale as Parameters<typeof req.payload.find>[0]['locale'],
    overrideAccess,
    pagination: false,
    req: queryReq,
    where: { [field]: { equals: value } },
  })

  return docs.some((doc) => doc.id !== id)
}
