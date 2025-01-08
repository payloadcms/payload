import type { Collection, PayloadRequest } from 'payload'

import { fileTypeFromFile } from 'file-type'
import fsPromises from 'fs/promises'
import httpStatus from 'http-status'
import path from 'path'
import { APIError } from 'payload'

import type { StreamFileOptions } from '../../../fetchAPI-stream-file/index.js';

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
    const fileSize = stats.size
    const fileTypeResult = (await fileTypeFromFile(filePath)) || getFileTypeFallback(filePath)
    const range = req.headers.get('range')
    let status = httpStatus.OK
    let options: StreamFileOptions | undefined

    let headers = new Headers()
    headers.set('Content-Type', fileTypeResult.mime)

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      headers.set('Accept-Ranges', 'bytes')
      headers.set('Content-Length', `${chunkSize}`)

      options = { end, start }
      status = httpStatus.PARTIAL_CONTENT
    } else {
      headers.set('Content-Length', fileSize + '')
    }

    headers = collection.config.upload?.modifyResponseHeaders
      ? collection.config.upload.modifyResponseHeaders({ headers })
      : headers

    const data = streamFile(filePath, options)

    return new Response(data, {
      headers: headersWithCors({
        headers,
        req,
      }),
      status,
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
