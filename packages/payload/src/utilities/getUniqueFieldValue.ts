import type { PayloadRequest } from '../types/index.js'

import { fieldValueExists } from './fieldValueExists.js'

type Args = {
  collection: string
  /** Also treat a value taken by a draft-only version as unavailable. */
  draftsEnabled?: boolean
  /** Field name to check for uniqueness. */
  field: string
  /** Exclude this doc from the check when updating; omit for a new doc. */
  id?: number | string
  /** Locale to scope the check to, for localized fields. */
  locale?: string
  req: PayloadRequest
  /**
   * Index the search starts from. `0` (default) tries the bare `value` first, then `value-1`, …
   * `1` always suffixes: `value-1`, `value-2`, … — useful for a counter that reads as `value-N`.
   */
  startIndex?: number
  value: string
}

// Bounded so a pathological run of taken suffixes can't loop forever; the check below is the guard.
const MAX_SUFFIX_ATTEMPTS = 50

/**
 * Returns the first available value for `field` in `collection` — either the bare `value` or a
 * `value-N` variant. Useful when a unique field value is minted outside the operation pipeline.
 */
export const getUniqueFieldValue = async ({
  id,
  collection,
  draftsEnabled,
  field,
  locale,
  req,
  startIndex = 0,
  value,
}: Args): Promise<string> => {
  for (let index = startIndex; index <= startIndex + MAX_SUFFIX_ATTEMPTS; index++) {
    const candidate = index === 0 ? value : `${value}-${index}`

    const taken = await fieldValueExists({
      id,
      collection,
      draftsEnabled,
      field,
      locale,
      req,
      value: candidate,
    })

    if (!taken) {
      return candidate
    }
  }

  return `${value}-${startIndex + MAX_SUFFIX_ATTEMPTS}`
}
