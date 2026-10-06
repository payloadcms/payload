import type { Collection, TypeWithID } from '../../collections/config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { Forbidden } from '../../errors/Forbidden.js'

export type ResolvedUploadDocument = {
  filename: string
  mimeType: string
  variants?: Record<string, { filename?: null | string; mimeType?: null | string } | null>
} & TypeWithID

/**
 * The primary filename, or a configured legacy image size's filename, both match.
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
    or: [{ filename: { equals: filename } }],
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
    const size = Object.values(document.variants ?? {}).find((size) => size?.filename === filename)

    if (size?.filename && size.mimeType) {
      return { filename: size.filename, mimeType: size.mimeType }
    }
  }

  return { filename: document.filename, mimeType: document.mimeType }
}

/**
 * Finds the upload document matching a filename (or one of its configured legacy
 * image sizes) and an optional storage `prefix`, without applying any access-control
 * filtering. Runs unconditionally — no `constraints.length` fast path — because
 * it's only ever called when at least one transformer is configured, and pipeline
 * planning needs the document's authoritative `mimeType` before access is enforced.
 */
export async function resolveUploadDocument({
  collection,
  filename,
  prefix,
  req,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
}): Promise<ResolvedUploadDocument | undefined> {
  if (filename.includes('../') || filename.includes('..\\')) {
    throw new Forbidden(req.t)
  }

  const { config } = collection

  const constraints: Where[] = [buildFilenameWhere({ filename, variants: config.upload.variants })]

  if (typeof prefix === 'string') {
    constraints.push({ prefix: { equals: prefix } })
  }

  const doc = await req.payload.db.findOne({
    collection: config.slug,
    req,
    where: constraints.length > 1 ? { and: constraints } : constraints[0],
  })

  return (doc as null | ResolvedUploadDocument) ?? undefined
}
