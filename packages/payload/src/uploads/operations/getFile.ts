import type { Stats } from 'fs'

import { fileTypeFromFile } from 'file-type'
import fsPromises from 'fs/promises'
import { status as httpStatus } from 'http-status'
import path from 'path'
import { z } from 'zod'

import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { defineOperation } from '../../operations/defineOperation.js'
import { collectionSchema, requestSchema } from '../../operations/schemaFields.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { streamFile } from '../fetchAPI-stream-file/index.js'
import { getFileTypeFallback } from '../getFileTypeFallback.js'
import { parseRangeHeader } from '../parseRangeHeader.js'

type GetFileInput = {
  collection: string
  filename: string
  prefix?: string
  req: PayloadRequest
}

const getFileSchema = z.looseObject({
  collection: collectionSchema,
  filename: z.string().min(1).describe('The stored file name'),
  prefix: z.string().optional(),
  req: requestSchema,
})

export const getFile = defineOperation({
  action: 'getFile',
  expose: {
    rest: [
      {
        handler: ({ invoke, req }) =>
          invoke({
            context: req.payload,
            input: {
              collection: getRequestCollection(req).config.slug,
              filename: req.routeParams?.filename as string,
              prefix: req.searchParams.get('prefix') ?? undefined,
              req,
            },
            validate: false,
          }),
        method: 'get',
        path: '/file/:filename',
      },
    ],
  },
  handler: async (
    payload: Payload,
    { collection: collectionSlug, filename, prefix, req }: GetFileInput,
  ): Promise<Response> => {
    const collection = payload.collections[collectionSlug]

    if (!collection?.config.upload) {
      throw new APIError(
        `This collection is not an upload collection: ${collectionSlug}`,
        httpStatus.BAD_REQUEST,
      )
    }

    const accessResult = (await checkFileAccess({ collection, filename, prefix, req }))!
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
            prefix,
          },
        })
        if (customResponse instanceof Response) {
          break
        }
      }

      if (customResponse instanceof Response) {
        return customResponse
      }
    }

    const fileDir = collection.config.upload.staticDir || collection.config.slug
    const resolvedDir = path.resolve(fileDir)
    const filePath = path.resolve(resolvedDir, filename)

    if (!filePath.startsWith(resolvedDir + path.sep)) {
      throw new APIError('Invalid filename.', httpStatus.BAD_REQUEST)
    }

    let stats: Stats
    try {
      stats = await fsPromises.stat(filePath)
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        req.payload.logger.error(
          `File ${filename} for collection ${collection.config.slug} is missing on the disk. Expected path: ${filePath}`,
        )

        return Response.json(
          { errors: [{ message: 'Something went wrong.' }] },
          {
            headers: headersWithCors({ headers: new Headers(), req }),
            status: httpStatus.INTERNAL_SERVER_ERROR,
          },
        )
      }

      throw error
    }

    const fileTypeResult = (await fileTypeFromFile(filePath)) || getFileTypeFallback(filePath)
    let mimeType = fileTypeResult.mime

    if (filePath.endsWith('.svg') && fileTypeResult.mime === 'application/xml') {
      mimeType = 'image/svg+xml'
    }

    const rangeResult = parseRangeHeader({
      fileSize: stats.size,
      rangeHeader: req.headers.get('range'),
    })

    if (rangeResult.type === 'invalid') {
      let headers = new Headers()
      headers.set('Content-Range', `bytes */${stats.size}`)
      headers = collection.config.upload.modifyResponseHeaders
        ? collection.config.upload.modifyResponseHeaders({ headers }) || headers
        : headers

      return new Response(null, {
        headers: headersWithCors({ headers, req }),
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
    const range = rangeResult.range

    if (rangeResult.type === 'partial' && range) {
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

    headers = collection.config.upload.modifyResponseHeaders
      ? collection.config.upload.modifyResponseHeaders({ headers }) || headers
      : headers

    return new Response(data, {
      headers: headersWithCors({ headers, req }),
      status,
    })
  },
  input: getFileSchema,
  target: 'uploadCollection',
})
