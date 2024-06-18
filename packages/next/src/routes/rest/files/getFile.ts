import type { Collection, PayloadRequestWithData } from 'payload'

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
  req: PayloadRequestWithData
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

    if (accessResult instanceof Response) return accessResult

    let response: Response = null
    if (collection.config.upload.handlers?.length) {
      for (const handler of collection.config.upload.handlers) {
        response = await handler(req, {
          doc: accessResult,
          params: {
            collection: collection.config.slug,
            filename,
          },
        })
      }

      if (response instanceof Response) return response
    }

    const fileDir = collection.config.upload?.staticDir || collection.config.slug
    const filePath = path.resolve(`${fileDir}/${filename}`)

    const stats = await fsPromises.stat(filePath)

    const data = streamFile(filePath)

    const headers = new Headers({
      'Content-Length': stats.size + '',
    })

    const fileTypeResult = (await fileTypeFromFile(filePath)) || getFileTypeFallback(filePath)
    headers.set('Content-Type', fileTypeResult.mime)

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
