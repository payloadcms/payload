import type { Collection, TypeWithID } from '../collections/config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { Forbidden } from '../errors/Forbidden.js'

export const checkFileAccess = async ({
  collection,
  filename,
  prefix,
  req,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
}): Promise<TypeWithID | undefined> => {
  if (filename.includes('../') || filename.includes('..\\')) {
    throw new Forbidden(req.t)
  }
  const { config } = collection

  const accessResult = await executeAccess(
    { data: { filename }, isReadingStaticFile: true, req },
    config.access.read,
  )

  const constraints: Where[] = []

  if (typeof accessResult === 'object') {
    constraints.push(accessResult)
  }

  if (typeof prefix === 'string') {
    constraints.push({ prefix: { equals: prefix } })
  }

  if (constraints.length > 0) {
    const filenameCondition: Where = {
      or: [{ filename: { equals: filename } }],
    }

    if (config.upload.imageSizes) {
      config.upload.imageSizes.forEach(({ name }) => {
        filenameCondition.or!.push({
          [`sizes.${name}.filename`]: { equals: filename },
        })
      })
    }

    const doc = await req.payload.db.findOne({
      collection: config.slug,
      req,
      where: { and: [filenameCondition, ...constraints] },
    })

    if (!doc) {
      throw new Forbidden(req.t)
    }

    return doc
  }
}
