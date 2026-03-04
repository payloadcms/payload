import type { Stats } from 'fs'

import { fileTypeFromFile } from 'file-type'
import fsPromises from 'fs/promises'
import { status as httpStatus } from 'http-status'
import path from 'path'

import type { PayloadHandler } from '../../config/types.js'
import type { Collection, PayloadRequest } from '../../index.js'
import type { File } from '../types.js'

import { APIError } from '../../errors/APIError.js'
import { checkFileAccess } from '../../uploads/checkFileAccess.js'
import { streamFile } from '../../uploads/fetchAPI-stream-file/index.js'
import { getFileTypeFallback } from '../../uploads/getFileTypeFallback.js'
import { parseRangeHeader } from '../../uploads/parseRangeHeader.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'

export const getFileResponse = async (
  req: PayloadRequest,
  collection: Collection,
  filename: string,
): Promise<Response> => {
  if (!collection.config.upload) {
    throw new APIError(
      `This collection is not an upload collection: ${collection.config.slug}`,
      httpStatus.BAD_REQUEST,
    )
  }

  const accessResult = (await checkFileAccess({
    collection,
    filename,
    req,
  }))!

  if (accessResult instanceof Response) {
    return accessResult
  }

  if (collection.config.upload.handlers?.length) {
    let customResponse: null | Response | void = null
    const headers = new Headers()

    for (const handler of collection.config.upload.handlers) {
      customResponse = await handler(req, {
        doc: accessResult,
        headers,
        params: {
          collection: collection.config.slug,
          filename,
        },
      })
      if (customResponse && customResponse instanceof Response) {
        break
      }
    }

    if (customResponse instanceof Response) {
      return customResponse
    }
  }

  const fileDir = collection.config.upload?.staticDir || collection.config.slug
  const filePath = path.resolve(`${fileDir}/${filename}`)
  let stats: Stats

  try {
    stats = await fsPromises.stat(filePath)
  } catch (err) {
    if ((err as { code?: string }).code === 'ENOENT') {
      req.payload.logger.error(
        `File ${filename} for collection ${collection.config.slug} is missing on the disk. Expected path: ${filePath}`,
      )

      // Omit going to the routeError handler by returning response instead of
      // throwing an error to cut down log noise. The response still matches what you get with APIError to not leak details to the user.
      return Response.json(
        {
          errors: [
            {
              message: 'Something went wrong.',
            },
          ],
        },
        {
          headers: headersWithCors({
            headers: new Headers(),
            req,
          }),
          status: 500,
        },
      )
    }

    throw err
  }

  const fileTypeResult = (await fileTypeFromFile(filePath)) || getFileTypeFallback(filePath)
  let mimeType = fileTypeResult.mime

  if (filePath.endsWith('.svg') && fileTypeResult.mime === 'application/xml') {
    mimeType = 'image/svg+xml'
  }

  // Parse Range header for byte range requests
  const rangeHeader = req.headers.get('range')
  const rangeResult = parseRangeHeader({
    fileSize: stats.size,
    rangeHeader,
  })

  if (rangeResult.type === 'invalid') {
    let headers = new Headers()
    headers.set('Content-Range', `bytes */${stats.size}`)
    headers = collection.config.upload?.modifyResponseHeaders
      ? collection.config.upload.modifyResponseHeaders({ headers }) || headers
      : headers

    return new Response(null, {
      headers: headersWithCors({
        headers,
        req,
      }),
      status: httpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
    })
  }

  let headers = new Headers()
  headers.set('Content-Type', mimeType)
  headers.set('Accept-Ranges', 'bytes')

  if (mimeType === 'image/svg+xml') {
    headers.set('Content-Security-Policy', "script-src 'none'")
  }

  let data: ReadableStream
  let status: number
  const isPartial = rangeResult.type === 'partial'
  const range = rangeResult.range

  if (isPartial && range) {
    const contentLength = range.end - range.start + 1
    headers.set('Content-Length', String(contentLength))
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${stats.size}`)
    data = streamFile({ filePath, options: { end: range.end, start: range.start } })
    status = httpStatus.PARTIAL_CONTENT
  } else {
    headers.set('Content-Length', String(stats.size))
    data = streamFile({ filePath })
    status = httpStatus.OK
  }

  headers = collection.config.upload?.modifyResponseHeaders
    ? collection.config.upload.modifyResponseHeaders({ headers }) || headers
    : headers

  return new Response(data, {
    headers: headersWithCors({
      headers,
      req,
    }),
    status,
  })
}

export const getFile = async (
  req: PayloadRequest,
  collection: Collection,
  filename: string,
): Promise<File> => {
  const res = await getFileResponse(req, collection, filename)
  const buffer = Buffer.from(await res.arrayBuffer())

  return {
    name: filename,
    data: buffer,
    mimetype: res.headers.get('content-type') || undefined!,
    size: Number(res.headers.get('content-length')) || 0,
  }
}

export const getFileHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const filename = req.routeParams?.filename as string

  return getFileResponse(req, collection, filename)
}
