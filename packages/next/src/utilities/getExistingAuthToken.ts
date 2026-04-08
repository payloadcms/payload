import { cookies as getCookies } from 'next/headers.js'

type Cookie = {
  name: string
  value: string
}
export async function getExistingAuthToken(cookiePrefix: string): Promise<Cookie | undefined> {
  const cookies = await getCookies()
  return cookies.getAll().find((cookie) => cookie.name.startsWith(cookiePrefix))
}
