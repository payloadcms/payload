import type { Collection, TypeWithID } from '../collections/config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { Forbidden } from '../errors/Forbidden.js'
import { resolveUploadDocument } from './transformers/resolveUploadDocument.js'

export const checkFileAccess = async ({
  collection,
  documentID,
  filename,
  prefix,
  req,
}: {
  collection: Collection
  documentID?: number | string
  filename: string
  prefix?: string
  req: PayloadRequest
}): Promise<TypeWithID | undefined> => {
  if (filename.includes('../') || filename.includes('..\\')) {
    throw new Forbidden(req.t)
  }
  const { config } = collection

  const accessResult = await executeAccess(
    { id: documentID, slug: config.slug, data: { filename }, isReadingStaticFile: true, req },
    config.access.read,
  )

  const constraints: Where[] = []

  if (typeof accessResult === 'object') {
    constraints.push(accessResult)
  }

  if (typeof prefix === 'string') {
    constraints.push({ prefix: { equals: prefix } })
  }

  if (constraints.length > 0 || documentID !== undefined) {
    const doc =
      documentID === undefined
        ? await resolveUploadDocument({
            collection,
            filename,
            prefix,
            req,
            where: typeof accessResult === 'object' ? accessResult : undefined,
          })
        : await req.payload.db.findOne({
            collection: config.slug,
            req,
            where: { and: [{ id: { equals: documentID } }, ...constraints] },
          })

    if (!doc) {
      throw new Forbidden(req.t)
    }

    return doc
  }
}
