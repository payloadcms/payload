import type { PayloadRequest, Where } from '../../../types/index.js'

type Args = {
  collection: string
  /** Exclude this document from the collision check (the doc being updated). Omit when the value is for a new document. */
  id?: number | string
  name: string
  req: PayloadRequest
  value: string
}

// Bounded so a pathological run of squatted suffixes can't loop forever; the field's
// unique index is the ultimate backstop if every attempt is somehow taken.
const MAX_SUFFIX_ATTEMPTS = 50

/**
 * Returns `value` if no other document in `collection` already uses it for the `name` slug field,
 * otherwise the first free `value-N` variant. Shared by every path that must mint a unique slug
 * outside the operation pipeline's runtime unique check — the id fallback on create and the
 * `beforeDuplicate` hook — so both dedupe identically. The unique index remains the final guard.
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
