import type { PayloadRequest } from '../../../types/index.js'
import type { FieldHook } from '../../config/types.js'

import { getUniqueFieldValue } from '../../../utilities/getUniqueFieldValue.js'
import { hasValue } from './hasValue.js'

type Args = {
  name: string
}

/**
 * `afterChange` hook for the native `slug` field. Backfills the document id as the slug when a
 * document is created with no value and no source — the id doesn't exist until insert, so it can't
 * be set in `beforeChange`. Guarantees every doc has a slug so a lookup by slug never 404s.
 *
 * Writes with `db.updateOne` to skip the pipeline (no hook recursion, no re-validation) inside the
 * create transaction, deduped through {@link getUniqueFieldValue}. The version is written before
 * `afterChange`, so it's patched too — the admin reads the latest version, not the main document.
 * Collections only; globals have no slug lookup to protect.
 */
export const generateSlugIdFallback =
  ({ name }: Args): FieldHook =>
  async ({ collection, operation, originalDoc, req, value }) => {
    if (operation !== 'create' || hasValue(value)) {
      return value
    }

    const id = originalDoc?.id

    if (!collection || id === undefined || id === null) {
      return value
    }

    const slug = await getUniqueFieldValue({
      id,
      collection: collection.slug,
      field: name,
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
 * Merges the slug into the latest version. `db.updateVersion` replaces the whole `version` object,
 * so it's read first and spread back with only the slug changed.
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
  req: PayloadRequest
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

  if (!latest || hasValue(latest.version?.[name])) {
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
