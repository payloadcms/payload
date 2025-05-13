import type { Stats } from 'fs'

// @ts-strict-ignore
import { fileTypeFromFile } from 'file-type'
import fsPromises from 'fs/promises'
import { status as httpStatus } from 'http-status'
import path from 'path'

import type { PayloadHandler } from '../../config/types.js'

import { APIError } from '../../errors/APIError.js'
import { checkFileAccess } from '../../uploads/checkFileAccess.js'
import { streamFile } from '../../uploads/fetchAPI-stream-file/index.js'
import { getFileTypeFallback } from '../../uploads/getFileTypeFallback.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'

export const getFileHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const filename = req.routeParams.filename as string

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
  let stats: Stats

  try {
    stats = await fsPromises.stat(filePath)
  } catch (err) {
    if (err.code === 'ENOENT') {
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
}
