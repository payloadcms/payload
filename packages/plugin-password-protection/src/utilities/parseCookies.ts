import type { Request } from 'express'

function parseCookies(req: Request): { [key: string]: string } {
  const list: { [key: string]: any } = {}
  const rc = req.headers.cookie

  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=')
      const keyToUse = parts.shift()?.trim() || ''
      list[keyToUse] = decodeURI(parts.join('='))
    })
  }

  return list
}

export default parseCookies
