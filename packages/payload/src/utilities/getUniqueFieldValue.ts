import type { PayloadRequest, Where } from '../types/index.js'

type Args = {
  collection: string
  /** Field name to check for uniqueness. */
  field: string
  /** Exclude this doc from the check when updating; omit for a new doc. */
  id?: number | string
  /** Locale to scope the check to, for localized fields. */
  locale?: string
  req: PayloadRequest
  value: string
}

// Bounded so a pathological run of taken suffixes can't loop forever; a unique index is the backstop.
const MAX_SUFFIX_ATTEMPTS = 50

/**
 * Returns `value`, or the first free `value-N`, so it's unique for `field` in `collection`. Useful
 * when a unique field value is minted outside the operation pipeline's runtime unique check.
 */
export const getUniqueFieldValue = async ({
  id,
  collection,
  field,
  locale,
  req,
  value,
}: Args): Promise<string> => {
  let candidate = value
  let attempt = 0

  while (attempt < MAX_SUFFIX_ATTEMPTS) {
    const match: Where = { [field]: { equals: candidate } }
    const where: Where =
      id === undefined || id === null ? match : { and: [match, { id: { not_equals: id } }] }

    const existing = await req.payload.db.findOne({ collection, locale, req, where })

    if (!existing) {
      return candidate
    }

    attempt += 1
    candidate = `${value}-${attempt}`
  }

  return candidate
}
