import type { PayloadRequest, Where } from '../../../types/index.js'

type Args = {
  collection: string
  /** Exclude this doc from the check when updating; omit for a new doc. */
  id?: number | string
  name: string
  req: PayloadRequest
  value: string
}

// Bounded so a pathological run of taken suffixes can't loop forever; the unique index is the backstop.
const MAX_SUFFIX_ATTEMPTS = 50

/**
 * Returns `value`, or the first free `value-N`, so it's unique for the `name` slug in `collection`.
 * Used where a slug is minted outside the pipeline's runtime unique check (the id fallback and
 * `beforeDuplicate`); the unique index is the final guard.
 */
export const ensureUniqueSlug = async ({
  id,
  name,
  collection,
  req,
  value,
}: Args): Promise<string> => {
  let candidate = value
  let attempt = 0

  while (attempt < MAX_SUFFIX_ATTEMPTS) {
    const match: Where = { [name]: { equals: candidate } }
    const where: Where =
      id === undefined || id === null ? match : { and: [match, { id: { not_equals: id } }] }

    const existing = await req.payload.db.findOne({ collection, req, where })

    if (!existing) {
      return candidate
    }

    attempt += 1
    candidate = `${value}-${attempt}`
  }

  return candidate
}
