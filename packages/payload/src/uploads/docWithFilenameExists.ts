import type { PayloadRequest, Where } from '../types/index.js'

import { buildFilenameWhere } from './transformers/resolveUploadDocument.js'

type Args = {
  collectionSlug: string
  excludeDocumentID?: number | string
  filename: string
  matchAnyPrefix?: boolean
  path: string
  prefix?: string
  req: PayloadRequest
}

export const docWithFilenameExists = async ({
  collectionSlug,
  excludeDocumentID,
  filename,
  matchAnyPrefix = false,
  prefix,
  req,
}: Args): Promise<boolean> => {
  const collection = req.payload.collections[collectionSlug]?.config
  const upload = collection?.upload
  const hasPrefixField = (collection?.fields ?? []).some(
    (field) => 'name' in field && field.name === 'prefix',
  )
  const filenameCondition = buildFilenameWhere({
    filename,
    variants: upload && typeof upload === 'object' ? upload.variants : undefined,
  })

  const constraints: Where[] = [filenameCondition]

  if (!matchAnyPrefix && typeof prefix === 'string' && hasPrefixField) {
    constraints.push({ prefix: { equals: prefix } })
  }

  if (excludeDocumentID !== undefined) {
    constraints.push({ id: { not_equals: excludeDocumentID } })
  }

  const where: Where = constraints.length > 1 ? { and: constraints } : filenameCondition

  const doc = await req.payload.db.findOne({
    collection: collectionSlug,
    req,
    where,
  })

  return !!doc
}
