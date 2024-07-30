import type { Request } from 'express'
import type { IncomingHttpHeaders } from 'http'

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

    const headers = uploadConfig.externalFileHeaderFilter
      ? uploadConfig.externalFileHeaderFilter(headersToObject(req.headers))
      : {
          cookie: req.headers?.['cookie'],
        }

    const res = await fetch(fileURL, {
      credentials: 'include',
      headers,
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

function headersToObject(headers: IncomingHttpHeaders) {
  return Object.entries(headers).reduce(
    (acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value.join(',')
      } else {
        acc[key] = value
      }

      return acc
    },
    {} as Record<string, string>,
  )
}
