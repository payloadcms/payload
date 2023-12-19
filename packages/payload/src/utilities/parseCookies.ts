import { APIError } from '../errors'

export default function parseCookies(headers: Request['headers']): Map<string, string> {
  const list = new Map<string, string>()
  const rc = headers.get('Cookie')

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      const key = parts.shift().trim()
      const encodedValue = parts.join('=')

      try {
        const decodedValue = decodeURI(encodedValue)
        list.set(key, decodedValue)
      } catch (e) {
        throw new APIError(`Error decoding cookie value for key ${key}: ${e.message}`)
      }
    })
  }

  return list
}
