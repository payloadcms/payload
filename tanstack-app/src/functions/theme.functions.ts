import { createServerFn } from '@tanstack/react-start'

/**
 * Resolves the admin theme, language, and text direction server-side from the
 * incoming request (cookies / headers / config), so the root route can set
 * `data-theme`, `lang`, and `dir` on the `<html>` element during SSR. This
 * mirrors what the Next.js adapter does in `packages/next/src/layouts/Root` and
 * prevents the flash of light mode on the first paint that occurs when these
 * attributes are only applied client-side after hydration.
 *
 * Kept intentionally lightweight (no `initReq` / `getPayload` access-control
 * work) since the root loader runs on every navigation.
 */
export const getInitialHtmlAttrsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getRequest } = await import('@tanstack/react-start/server')
  const { getRequestLanguage, parseCookies } = await import('payload')
  const { rtlLanguages } = await import('@payloadcms/translations')
  const { getRequestTheme } = await import('@payloadcms/tanstack-start/server')
  const config = await (await import('@payload-config')).default

  const webRequest = getRequest()
  const headers = new Headers(webRequest.headers)
  const cookies = parseCookies(headers)

  const theme = getRequestTheme({ config, cookies, headers })
  const languageCode = getRequestLanguage({ config, cookies, headers })
  const dir = (rtlLanguages as unknown as string[]).includes(languageCode) ? 'rtl' : 'ltr'

  return { dir, languageCode, theme }
})
