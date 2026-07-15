import { getRequest } from '@tanstack/react-start/server'
import { parseCookies } from 'payload'

type Cookie = {
  name: string
  value: string
}

export function getExistingAuthToken(cookiePrefix: string): Cookie | undefined {
  const request = getRequest()
  const headers = new Headers(request.headers)
  const cookies = parseCookies(headers)

  for (const [name, value] of cookies.entries()) {
    if (name.startsWith(cookiePrefix)) {
      return { name, value }
    }
  }

  return undefined
}
