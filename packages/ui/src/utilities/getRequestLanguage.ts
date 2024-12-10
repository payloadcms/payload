import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies.js'

type GetRequestLanguageArgs = {
  cookies: Map<string, string> | ReadonlyRequestCookies
  defaultLanguage?: string
  headers: Request['headers']
}

export const getRequestLanguage = ({
  cookies,
  defaultLanguage = 'en',
  headers,
}: GetRequestLanguageArgs): string => {
  const acceptLanguage = headers.get('Accept-Language')
  const cookieLanguage = cookies.get('lng')

  return (
    acceptLanguage ||
    (typeof cookieLanguage === 'string' ? cookieLanguage : cookieLanguage.value) ||
    defaultLanguage
  )
}
