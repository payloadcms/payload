import type { AdminContext } from 'payload'

import { initAdminContext } from 'payload/internal'

type Context = Pick<AdminContext, 'cookies' | 'req'>

export async function getRequestInfo(request: Request) {
  const { headers } = request
  const response = await fetch(request.url, { headers })

  return { headers: response.headers, status: response.status }
}

export async function getContext(args: Parameters<typeof initAdminContext>[0]) {
  const { cookies, req } = await initAdminContext(args)

  return { cookies, userAgent: req.headers.get('user-agent') }
}

export function getLanguage(languageCode: string, context: Context) {
  const initAdminContext = (value: { headers: Headers }) => value

  return { context, headers: initAdminContext({ headers: new Headers() }).headers, languageCode }
}
