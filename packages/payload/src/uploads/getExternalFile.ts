import type { Request } from 'express'

import type { File, FileData, IncomingUploadType } from './types'

import { APIError } from '../errors'

type Args = {
  data: FileData
  req: Request
  uploadConfig: IncomingUploadType
}
export const getExternalFile = async ({ data, req, uploadConfig }: Args): Promise<File> => {
  const { filename, url } = data

  if (typeof url === 'string') {
    let fileURL = url
    if (!url.startsWith('http')) {
      const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`
      fileURL = `${baseUrl}${url}`
    }

    const { default: fetch } = (await import('node-fetch')) as any

    // Convert headers
    const convertedHeaders: Record<string, string> = headersToObject(req.headers)

    const headers = uploadConfig.externalFileHeaderFilter
      ? uploadConfig.externalFileHeaderFilter(convertedHeaders)
      : {
          cookie: req.headers['cookie'],
        }

    const res = await fetch(fileURL, {
      credentials: 'include',
      headers: {
        headers,
      },
      method: 'GET',
    })

    if (!res.ok) throw new APIError(`Failed to fetch file from ${fileURL}`, res.status)

    const data = await res.buffer()

    return {
      name: filename,
      data,
      mimetype: res.headers.get('content-type') || undefined,
      size: Number(res.headers.get('content-length')) || 0,
    }
  }

  throw new APIError('Invalid file url', 400)
}

function headersToObject(headers) {
  const headersObj = {}
  headers.forEach((value, key) => {
    // If the header value is an array, join its elements into a single string
    if (Array.isArray(value)) {
      headersObj[key] = value.join(', ')
    } else {
      headersObj[key] = value
    }
  })
  return headersObj
}
