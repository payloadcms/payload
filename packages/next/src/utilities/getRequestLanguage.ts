import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { matchLanguage } from '@payloadcms/translations'

type GetRequestLanguageArgs = {
  cookies: Map<string, string> | ReadonlyRequestCookies
  headers: Request['headers']
  defaultLanguage?: string
}

export const getRequestLanguage = ({
  headers,
  cookies,
  defaultLanguage = 'en',
}: GetRequestLanguageArgs): string => {
  const acceptLanguage = headers.get('Accept-Language')
  const cookieLanguage = cookies.get('lng')

  let reqLanguage =
    acceptLanguage ||
    (typeof cookieLanguage === 'string' ? cookieLanguage : cookieLanguage.value) ||
    defaultLanguage

  return matchLanguage(reqLanguage)
}
