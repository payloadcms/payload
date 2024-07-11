import type { Request } from 'express'

export function parseCookies(req: Request): { [key: string]: string } {
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
        // swallow e
      }
    })
  }

  return list
}
