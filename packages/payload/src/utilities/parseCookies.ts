export const parseCookies = (headers: Request['headers']): Map<string, string> => {
  const list = new Map<string, string>()
  const rc = headers.get('Cookie')

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      const key = parts.shift()?.trim()
      const encodedValue = parts.join('=')

      try {
        const decodedValue = decodeURI(encodedValue)
        list.set(key!, decodedValue)
      } catch {
        // ignore invalid encoded values
      }
    })
  }

  return list
}
