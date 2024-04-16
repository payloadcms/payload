import type { Collection, PayloadRequest } from 'payload/types'

import fsPromises from 'fs/promises'
import httpStatus from 'http-status'
import path from 'path'
import { APIError } from 'payload/errors'

import { streamFile } from '../../../next-stream-file/index.js'
import { routeError } from '../routeError.js'
import { checkFileAccess } from './checkFileAccess.js'

// /:collectionSlug/file/:filename
type Args = {
  collection: Collection
  filename: string
  req: PayloadRequest
}
export const getFile = async ({ collection, filename, req }: Args): Promise<Response> => {
  try {
    if (!collection.config.upload) {
      throw new APIError(
        `This collection is not an upload collection: ${collection.config.slug}`,
        httpStatus.BAD_REQUEST,
      )
    }

    if (collection.config.upload.disableLocalStorage && !collection.config.upload.handlers) {
      throw new APIError(
        `This collection has local storage disabled: ${collection.config.slug}`,
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
        response = await handler(req, {
          params: {
            collection: collection.config.slug,
            filename,
          },
        })
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
    return routeError({
      collection,
      config: req.payload.config,
      err: error,
      req,
    })
  }
}
