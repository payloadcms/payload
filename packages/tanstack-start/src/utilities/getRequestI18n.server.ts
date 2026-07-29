import type { I18nClient } from '@payloadcms/translations'
import type { SanitizedConfig } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { getRequest } from '@tanstack/react-start/server'
import { getRequestLanguage, parseCookies } from 'payload'

/**
 * Resolves the client `I18n` for the current TanStack Start request without a
 * full `initReq` (no `getPayload`/auth/access). Mirrors the Next.js adapter's
 * `getNextRequestI18n` and feeds the shared `generatePageMetadata`, which only
 * needs `config` + `i18n` to translate admin-page titles.
 */
export async function getRequestI18n({ config }: { config: SanitizedConfig }): Promise<I18nClient> {
  const webRequest = getRequest()
  const headers = new Headers(webRequest.headers)
  const cookies = parseCookies(headers)

  const languageCode = getRequestLanguage({ config, cookies, headers })

  return initI18n({
    config: config.i18n,
    context: 'client',
    language: languageCode,
  })
}
