import type { PayloadRequest } from '../exports/types'
import type { File, FileData } from './types'

import { APIError } from '../errors'

type Args = {
  data: FileData
  req: PayloadRequest
}
export const getExternalFile = async ({ data, req }: Args): Promise<File> => {
  const baseUrl = req.origin || `${req.protocol}://${req.host}`
  const { filename, url } = data

  if (typeof url === 'string') {
    const fileURL = `${baseUrl}${url}`
    const { default: fetch } = (await import('node-fetch')) as any

    const res = await fetch(fileURL, {
      credentials: 'include',
      headers: {
        ...req.headers,
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
