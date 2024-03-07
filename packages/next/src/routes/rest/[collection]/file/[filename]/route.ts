import type { Collection, PayloadRequest, SanitizedConfig, Where } from 'payload/types'

import fsPromises from 'fs/promises'
import httpStatus from 'http-status'
import path from 'path'
import { executeAccess } from 'payload/auth'
import { APIError, Forbidden } from 'payload/errors'

import { streamFile } from '../../../../../next-stream-file/index.js'
import { createPayloadRequest } from '../../../../../utilities/createPayloadRequest.js'
import { RouteError } from '../../../RouteError.js'
import { endpointsAreDisabled } from '../../../checkEndpoints.js'

async function checkFileAccess({
  collection,
  filename,
  req,
}: {
  collection: Collection
  filename: string
  req: PayloadRequest
}) {
  const { config } = collection
  const disableEndpoints = endpointsAreDisabled({ endpoints: config.endpoints, request: req })
  if (disableEndpoints) return disableEndpoints

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

export const GET =
  (config: Promise<SanitizedConfig>) =>
  async (request: Request, { params }: { params: { collection: string; filename: string } }) => {
    const { collection: collectionSlug, filename } = params
    let req: PayloadRequest
    let collection: Collection

    try {
      req = await createPayloadRequest({
        config,
        params: { collection: collectionSlug },
        request,
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

      if (collection.config.upload.disableLocalStorage && !collection.config.upload.handlers) {
        throw new APIError(
          `This collection has local storage disabled: ${collectionSlug}`,
          httpStatus.BAD_REQUEST,
        )
      }

      await checkFileAccess({
        collection,
        filename,
        req,
      })

      let response: Response = null
      if (collection.config.upload.handlers?.length) {
        for (const handler of collection.config.upload.handlers) {
          response = await handler(req, { params })
        }

        return response
      }

      const fileDir = collection.config.upload?.staticDir || collection.config.slug
      const filePath = path.resolve(`${fileDir}/${filename}`)

      const stats = await fsPromises.stat(filePath)
      const data = streamFile(filePath)

      return new Response(data, {
        headers: new Headers({
          'content-length': stats.size + '',
        }),
        status: httpStatus.OK,
      })
    } catch (error) {
      return RouteError({
        collection,
        err: error,
        req,
      })
    }
  }
