import type { Request } from 'express'

import { APIError } from '../errors'

export default function parseCookies(req: Request): { [key: string]: string } {
  const list = {}
  const rc = req.headers.cookie

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      const key = parts.shift().trim()
      const encodedValue = parts.join('=')

      try {
        const decodedValue = decodeURI(encodedValue)
        list[key] = decodedValue
      } catch (e) {
        throw new APIError(`Error decoding cookie value for key ${key}: ${e.message}`)
      }
    })
  }

  return list
}
