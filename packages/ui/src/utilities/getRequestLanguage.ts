import type { CookieStore } from 'payload'

type GetRequestLanguageArgs = {
  cookies: CookieStore | Map<string, string>
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
