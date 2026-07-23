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
 * On a versioned collection the current version is written before `afterChange` runs, so it still
 * holds the empty slug — the admin (and autosave) read the latest version, not the main document.
 * The latest version is therefore patched in place too, so the slug is present wherever it is read.
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

    if (collection.versions) {
      await patchLatestVersionSlug({ id, name, slug, collection: collection.slug, req })
    }

    return slug
  }

/**
 * Merges the backfilled slug into the latest version's stored document, leaving every other field
 * untouched. `db.updateVersion` replaces the whole `version` object, so the current version must be
 * read first and spread back with only the slug changed.
 */
const patchLatestVersionSlug = async ({
  id,
  name,
  slug,
  collection,
  req,
}: {
  collection: string
  id: number | string
  name: string
  req: Parameters<FieldHook>[0]['req']
  slug: string
}): Promise<void> => {
  const { docs } = await req.payload.db.findVersions({
    collection,
    limit: 1,
    pagination: false,
    req,
    sort: '-updatedAt',
    where: { parent: { equals: id } },
  })

  const latest = docs[0]

  if (
    !latest ||
    (latest.version?.[name] !== undefined &&
      latest.version?.[name] !== null &&
      latest.version?.[name] !== '')
  ) {
    return
  }

  await req.payload.db.updateVersion({
    id: latest.id,
    collection,
    req,
    versionData: {
      createdAt: latest.createdAt,
      latest: latest.latest,
      parent: latest.parent,
      updatedAt: latest.updatedAt,
      version: { ...latest.version, [name]: slug },
    },
  })
}
