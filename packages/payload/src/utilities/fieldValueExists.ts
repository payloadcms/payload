import type { DocumentMatchingWhereExistsArgs } from './documentMatchingWhereExists.js'

import { documentMatchingWhereExists } from './documentMatchingWhereExists.js'

type Args = {
  field: string
  value: unknown
} & Omit<DocumentMatchingWhereExistsArgs, 'where'>

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
  overrideAccess = false,
  req,
  value,
}: Args): Promise<boolean> => {
  return documentMatchingWhereExists({
    id,
    collection,
    draftsEnabled,
    locale,
    overrideAccess,
    req,
    where: { [field]: { equals: value } },
  })
}
