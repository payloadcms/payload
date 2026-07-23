import type { FieldHook } from '../../config/types.js'

import { ensureUniqueSlug } from './ensureUniqueSlug.js'

type Args = {
  name: string
}

/**
 * `afterChange` hook for the native `slug` field.
 *
 * Backfills the document id as the slug when a document is created without one — no explicit value
 * and no source to derive from. This guarantees every document has a slug the moment it exists, so a
 * frontend lookup by slug never 404s against a freshly created doc.
 *
 * The id is used because it exists only after the row is inserted (so it is unavailable in
 * `beforeChange`) and is inherently unique and url-safe. The write goes through `db.updateOne`, which
 * bypasses the operation pipeline: it neither re-runs field hooks (no recursion into this hook) nor
 * re-validates, and it shares the create transaction via `req` so the backfill commits atomically
 * with the document. Because the pipeline's runtime uniqueness check is skipped, uniqueness is
 * enforced via {@link ensureUniqueSlug}, with the field's unique index as the final guard.
 *
 * Only collections are backfilled; globals are singletons with no slug-based lookup to protect.
 */
export const generateSlugIdFallback =
  ({ name }: Args): FieldHook =>
  async ({ collection, operation, originalDoc, req, value }) => {
    if (operation !== 'create' || (value !== undefined && value !== null && value !== '')) {
      return value
    }

    const id = originalDoc?.id

    if (!collection || id === undefined || id === null) {
      return value
    }

    const slug = await ensureUniqueSlug({
      id,
      name,
      collection: collection.slug,
      req,
      value: String(id),
    })

    await req.payload.db.updateOne({
      id,
      collection: collection.slug,
      data: { [name]: slug },
      req,
      returning: false,
    })

    return slug
  }
