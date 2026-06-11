import type { MaybePromise, SanitizedConfig } from 'payload'

import { setResponseHeader } from '@tanstack/react-start/server'
import { getPayload } from 'payload'

export async function switchLanguage({
  config,
  language,
}: {
  config: MaybePromise<SanitizedConfig>
  language: string
}) {
  const payload = await getPayload({ config })
  const cookiePrefix = payload.config.cookiePrefix || 'payload'

  setResponseHeader(
    'Set-Cookie',
    `${encodeURIComponent(`${cookiePrefix}-lng`)}=${encodeURIComponent(language)}; Path=/`,
  )
}
