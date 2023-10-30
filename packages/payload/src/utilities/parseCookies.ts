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
        let message = 'Unknown error'
        if ('message' in e && typeof e.message === 'string') {
          message = e.message
        } else if (typeof e === 'string') {
          message = e
        }
        throw new APIError(`Error decoding cookie value for key ${key}: ${message}`)
      }
    })
  }

  return list
}
