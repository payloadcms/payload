import type { Collection, PayloadRequest } from 'payload'

import { fileTypeFromFile } from 'file-type'
import fsPromises from 'fs/promises'
import httpStatus from 'http-status'
import path from 'path'
import { APIError } from 'payload'

import { streamFile } from '../../../fetchAPI-stream-file/index.js'
import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { routeError } from '../routeError.js'
import { checkFileAccess } from './checkFileAccess.js'
import { getFileTypeFallback } from './getFileTypeFallback.js'

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

    const accessResult = await checkFileAccess({
      collection,
      filename,
      req,
    })

    if (accessResult instanceof Response) {
      return accessResult
    }

    if (collection.config.upload.handlers?.length) {
      let customResponse = null
      for (const handler of collection.config.upload.handlers) {
        customResponse = await handler(req, {
          doc: accessResult,
          params: {
            collection: collection.config.slug,
            filename,
          },
        })
      }

      if (customResponse instanceof Response) {
        return customResponse
      }
    }

    const fileDir = collection.config.upload?.staticDir || collection.config.slug
    const filePath = path.resolve(`${fileDir}/${filename}`)
    const stats = await fsPromises.stat(filePath)
    const data = streamFile(filePath)
    const fileTypeResult = (await fileTypeFromFile(filePath)) || getFileTypeFallback(filePath)

    let headers = new Headers()
    headers.set('Content-Type', fileTypeResult.mime)
    headers.set('Content-Length', stats.size + '')
    headers = collection.config.upload?.modifyResponseHeaders
      ? collection.config.upload.modifyResponseHeaders({ headers })
      : headers

    return new Response(data, {
      headers: headersWithCors({
        headers,
        req,
      }),
      status: httpStatus.OK,
    })
  } catch (err) {
    return routeError({
      collection,
      config: req.payload.config,
      err,
      req,
    })
  }
}
