// @ts-strict-ignore
import type { Collection, TypeWithID } from '../collections/config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import executeAccess from '../auth/executeAccess.js'
import { Forbidden } from '../errors/Forbidden.js'

export const checkFileAccess = async ({
  collection,
  filename,
  req,
}: {
  collection: Collection
  filename: string
  req: PayloadRequest
}): Promise<TypeWithID> => {
  if (filename.includes('../') || filename.includes('..\\')) {
    throw new Forbidden(req.t)
  }
  const { config } = collection

  const accessResult = await executeAccess(
    { data: { filename }, isReadingStaticFile: true, req },
    config.access.read,
  )

  if (typeof accessResult === 'object') {
    const queryToBuild: Where = {
      and: [
        {
          or: [
            {
              filename: {
                equals: filename,
              },
            },
          ],
        },
        accessResult,
      ],
    }

    if (config.upload.imageSizes) {
      config.upload.imageSizes.forEach(({ name }) => {
        queryToBuild.and[0].or.push({
          [`sizes.${name}.filename`]: {
            equals: filename,
          },
        })
      })
    }

    const doc = await req.payload.db.findOne({
      collection: config.slug,
      req,
      where: queryToBuild,
    })

    if (!doc) {
      throw new Forbidden(req.t)
    }

    return doc
  }
}
