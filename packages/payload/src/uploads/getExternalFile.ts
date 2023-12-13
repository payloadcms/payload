import type { File, FileData } from './types'
import { Request } from 'express'
import { APIError } from '../errors'

type Args = {
  req: Request
  data: FileData
}
export const getExternalFile = async ({ req, data }: Args): Promise<File> => {
  const baseUrl = req.get('origin') || `${req.protocol}://${req.get('host')}`
  const { url, filename } = data

  if (typeof url === 'string') {
    const fileURL = `${baseUrl}${url}`
    const { default: fetch } = (await import('node-fetch')) as any

    const res = await fetch(fileURL, {
      credentials: 'include',
      method: 'GET',
      headers: {
        ...req.headers,
      },
    })

    if (!res.ok) throw new APIError(`Failed to fetch file from ${fileURL}`)

    const data = await res.buffer()

    return {
      name: filename,
      data,
      mimetype: res.headers.get('content-type') || undefined,
      size: Number(res.headers.get('content-length')) || 0,
    }
  }
}
