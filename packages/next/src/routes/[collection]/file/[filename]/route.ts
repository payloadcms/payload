import path from 'path'
import config from 'payload-config'
import { streamFile } from '../../../../next-stream-file'
import fsPromises from 'fs/promises'
import { Collection, PayloadRequest, Where } from 'payload/types'
import executeAccess from 'payload/dist/auth/executeAccess'
import { APIError, Forbidden } from 'payload/errors'
import { RouteError } from '../../../RouteError'
import { createPayloadRequest } from '../../../../utilities/createPayloadRequest'
import httpStatus from 'http-status'

async function checkFileAccess({
  req,
  filename,
  collection,
}: {
  req: PayloadRequest
  filename: string
  collection: Collection
}) {
  const { config } = collection
  const accessResult = await executeAccess({ isReadingStaticFile: true, req }, config.access.read)

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
  }
}

export const GET = async (
  request: Request,
  { params }: { params: { collection: string; filename: string } },
) => {
  const { collection: collectionSlug, filename } = params
  let req: PayloadRequest
  let collection: Collection

  try {
    req = await createPayloadRequest({
      request,
      config,
      params: { collection: collectionSlug },
    })
    collection = req.payload.collections?.[collectionSlug]

    if (!collection) {
      throw new APIError(`Media collection not found: ${collectionSlug}`, httpStatus.BAD_REQUEST)
    }

    if (!collection.config.upload) {
      throw new APIError(
        `This collection is not an upload collection: ${collectionSlug}`,
        httpStatus.BAD_REQUEST,
      )
    }

    if (collection.config.upload.disableLocalStorage) {
      throw new APIError(
        `This collection has local storage disabled: ${collectionSlug}`,
        httpStatus.BAD_REQUEST,
      )
    }

    await checkFileAccess({
      req,
      filename,
      collection,
    })

    const fileDir = collection.config.upload?.staticDir || collection.config.slug
    const filePath = path.resolve(`${fileDir}/${filename}`)
    const stats = await fsPromises.stat(filePath)
    const data = streamFile(filePath)
    return new Response(data, {
      status: httpStatus.OK,
      headers: new Headers({
        'content-length': stats.size + '',
      }),
    })
  } catch (error) {
    return RouteError({
      req,
      collection,
      err: error,
    })
  }
}
