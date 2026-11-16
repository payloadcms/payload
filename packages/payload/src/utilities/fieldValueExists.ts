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
 * request by default. This avoids concurrent session operations during slug generation in field
 * hooks. On-demand validation can opt into the caller's transaction to see uncommitted writes.
 * `draft` includes slugs that only exist in a draft version.
 */
export const fieldValueExists = async ({
  id,
  collection,
  draftsEnabled,
  field,
  locale,
  overrideAccess = false,
  req,
  shouldUseTransaction,
  value,
}: Args): Promise<boolean> => {
  return documentMatchingWhereExists({
    id,
    collection,
    draftsEnabled,
    locale,
    overrideAccess,
    req,
    shouldUseTransaction,
    where: { [field]: { equals: value } },
  })
}
