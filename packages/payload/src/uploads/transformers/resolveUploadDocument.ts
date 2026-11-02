import type { Collection, TypeWithID } from '../../collections/config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { Forbidden } from '../../errors/Forbidden.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'

export type ResolvedUploadDocument = {
  filename: string
  mimeType: string
  original?: { filename?: null | string; mimeType?: null | string } | null
  variants?: Record<string, { filename?: null | string; mimeType?: null | string } | null>
} & TypeWithID

/**
 * The primary filename, original filename, or a configured legacy image size's filename match.
 * Shared with `checkFileAccess.ts` so the two lookups can't drift apart.
 */
export function buildFilenameWhere({
  filename,
  variants,
}: {
  filename: string
  variants?: { name: string }[]
}): Where {
  const filenameCondition: Where = {
    or: [{ filename: { equals: filename } }, { 'original.filename': { equals: filename } }],
  }

  variants?.forEach(({ name }) => {
    filenameCondition.or!.push({
      [`variants.${name}.filename`]: { equals: filename },
    })
  })

  return filenameCondition
}

/**
 * The `filename` and `mimeType` of the file a request actually targets: the
 * primary file, or the legacy image size whose filename matched (a size can be
 * stored in a different format than the primary file via `formatOptions`).
 */
export function getRequestedFile({
  document,
  filename,
}: {
  document: ResolvedUploadDocument
  filename: string
}): { filename: string; mimeType: string } {
  if (document.filename !== filename) {
    if (document.original?.filename === filename && document.original.mimeType) {
      return { filename, mimeType: document.original.mimeType }
    }

    const size = Object.values(document.variants ?? {}).find((size) => size?.filename === filename)

    if (size?.filename && size.mimeType) {
      return { filename: size.filename, mimeType: size.mimeType }
    }
  }

  return { filename: document.filename, mimeType: document.mimeType }
}

/**
 * Finds a current upload or latest draft by filename and optional storage prefix.
 * Always looks up the document when called: transformer planning needs its
 * authoritative mimeType even when read access returns true. The transformer lookup
 * is unfiltered; callers enforcing access can supply their read constraints.
 * Older versions are resolved separately through an explicit version ID.
 */
export async function resolveUploadDocument({
  collection,
  filename,
  prefix,
  req,
  where,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
  where?: Where
}): Promise<ResolvedUploadDocument | undefined> {
  if (filename.includes('../') || filename.includes('..\\')) {
    throw new Forbidden(req.t)
  }

  const { config } = collection

  const constraints: Where[] = [buildFilenameWhere({ filename, variants: config.upload.variants })]

  if (typeof prefix === 'string') {
    constraints.push({ prefix: { equals: prefix } })
  }

  if (where) {
    constraints.push(where)
  }

  const query = constraints.length > 1 ? { and: constraints } : constraints[0]

  const doc = await req.payload.db.findOne({
    collection: config.slug,
    req,
    where: query,
  })

  if (!doc && config.versions && config.versions.drafts) {
    const { docs } = await req.payload.db.queryDrafts({
      collection: config.slug,
      limit: 1,
      pagination: true,
      req,
      where: appendVersionToQueryKey(query),
    })

    return docs[0] as ResolvedUploadDocument | undefined
  }

  return (doc as null | ResolvedUploadDocument) ?? undefined
}
