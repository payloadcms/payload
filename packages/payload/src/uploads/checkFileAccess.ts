import type { Collection, TypeWithID } from '../collections/config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { executeAccess } from '../auth/executeAccess.js'
import { Forbidden } from '../errors/Forbidden.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { appendVersionToQueryKey } from '../versions/drafts/appendVersionToQueryKey.js'

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

    const where: Where = { and: [filenameCondition, ...constraints] }

    const doc = await req.payload.db.findOne({
      collection: config.slug,
      req,
      where,
    })

    if (doc) {
      return doc
    }

    // Queries the version collection if `hasDraftsEnabled` is true:
    //
    // The base collection row only reflects the most recently committed
    // (published) state. When a file is reuploaded on a draft, the new
    // filename is written to the latest *version*, while the base row still
    // points at the previously committed filename. The findOne above therefore
    // misses the draft-only filename and access is wrongly denied.
    if (hasDraftsEnabled(config)) {
      const { docs } = await req.payload.db.queryDrafts({
        collection: config.slug,
        limit: 1,
        req,
        where: appendVersionToQueryKey(where),
      })

      if (docs[0]) {
        return docs[0]
      }
    }

    throw new Forbidden(req.t)
  }
}
