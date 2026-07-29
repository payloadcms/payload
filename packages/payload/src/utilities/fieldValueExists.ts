import type { DefaultDocumentIDType, Locale } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

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
  req: PayloadRequest
  value: unknown
}

/**
 * Whether another document in `collection` already uses `value` for `field`.
 *
 * Runs the `find` operation without threading `req`, so it queries outside the caller's transaction:
 * a committed read is what a uniqueness check wants (other documents are committed, the document
 * being written is excluded by `id`), and it avoids the "cursor on a session with a transaction in
 * progress" error that a transactional read from inside a hook would hit. `draft` includes slugs
 * that only exist in a draft version.
 */
export const fieldValueExists = async ({
  id,
  collection,
  draftsEnabled,
  field,
  locale,
  req,
  value,
}: Args): Promise<boolean> => {
  const { docs } = await req.payload.find({
    collection,
    depth: 0,
    draft: Boolean(draftsEnabled),
    limit: 2,
    locale: locale as Parameters<typeof req.payload.find>[0]['locale'],
    overrideAccess: true,
    pagination: false,
    where: { [field]: { equals: value } },
  })

  return docs.some((doc) => doc.id !== id)
}
