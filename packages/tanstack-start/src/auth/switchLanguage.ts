import type { MaybePromise, SanitizedConfig } from 'payload'

import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { getPayload } from 'payload'

type SwitchLanguageArgs = {
  config: MaybePromise<SanitizedConfig>
  language: string
}

export const switchLanguageServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: SwitchLanguageArgs) => data)
  .handler(async ({ data }) => {
    const { config, language } = data

    const payload = await getPayload({ config })
    const cookiePrefix = payload.config.cookiePrefix || 'payload'

    setResponseHeader(
      'Set-Cookie',
      `${encodeURIComponent(`${cookiePrefix}-lng`)}=${encodeURIComponent(language)}; Path=/`,
    )
  })
