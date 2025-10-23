import type { ClientTranslationsObject, I18nClient } from '@payloadcms/translations'

import { initI18n } from '@payloadcms/translations'
import { cookies, headers } from 'next/headers.js'
import { getRequestLanguage, type SanitizedConfig } from 'payload'

/**
 * In the context of Next.js, this function initializes the i18n object for the current request.
 *
 * It must be called on the server side, and within the lifecycle of a request since it relies on the request headers and cookies.
 */
export const getNextRequestI18n = async <
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TAdditionalTranslations = {},
  TAdditionalClientTranslationKeys extends string = never,
>({
  config,
}: {
  config: SanitizedConfig
}): Promise<
  [TAdditionalClientTranslationKeys] extends [never]
    ? I18nClient
    : TAdditionalTranslations extends object
      ? I18nClient<TAdditionalTranslations, TAdditionalClientTranslationKeys>
      : I18nClient<ClientTranslationsObject, TAdditionalClientTranslationKeys>
> => {
  return (await initI18n({
    config: config.i18n,
    context: 'client',
    language: getRequestLanguage({ config, cookies: await cookies(), headers: await headers() }),
  })) as any
}
