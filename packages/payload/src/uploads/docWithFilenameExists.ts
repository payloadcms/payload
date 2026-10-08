import type { PayloadRequest, Where } from '../types/index.js'

import { buildFilenameWhere } from './transformers/resolveUploadDocument.js'

type Args = {
  collectionSlug: string
  filename: string
  matchAnyPrefix?: boolean
  path: string
  prefix?: string
  req: PayloadRequest
}

export const docWithFilenameExists = async ({
  collectionSlug,
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

  const where: Where =
    !matchAnyPrefix && typeof prefix === 'string' && hasPrefixField
      ? { and: [filenameCondition, { prefix: { equals: prefix } }] }
      : filenameCondition

  const doc = await req.payload.db.findOne({
    collection: collectionSlug,
    req,
    where,
  })

  return !!doc
}
