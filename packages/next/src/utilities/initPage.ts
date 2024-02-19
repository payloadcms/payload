import { headers as getHeaders } from 'next/headers'

import { auth } from './auth'

import { getPayload } from 'payload'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import { redirect } from 'next/navigation'
import { parseCookies } from 'payload/auth'
import { getRequestLanguage } from './getRequestLanguage'
import { findLocaleFromCode } from '../../../ui/src/utilities/findLocaleFromCode'
import type { I18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/all'
import { initI18n } from '@payloadcms/translations'

export const initPage = async ({
  config: configPromise,
  redirectUnauthenticatedUser = false,
  collectionSlug,
  globalSlug,
  localeParam,
}: {
  config: SanitizedConfig | Promise<SanitizedConfig>
  redirectUnauthenticatedUser?: boolean
  collectionSlug?: string
  globalSlug?: string
  localeParam?: string
}): Promise<{
  payload: Awaited<ReturnType<typeof getPayload>>
  permissions: Awaited<ReturnType<typeof auth>>['permissions']
  user: Awaited<ReturnType<typeof auth>>['user']
  config: SanitizedConfig
  i18n: I18n
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  locale: ReturnType<typeof findLocaleFromCode>
}> => {
  const headers = getHeaders()
  const cookies = parseCookies(headers)

  const { permissions, user } = await auth({
    headers,
    config: configPromise,
    cookies,
  })
  const language = getRequestLanguage({ cookies, headers })

  const config = await configPromise

  const { localization, routes, collections, globals } = config

  if (redirectUnauthenticatedUser && !user) {
    // `redirect(`${payload.config.routes.admin}/unauthorized`)` is not built yet
    redirect(`${routes.admin}/login`)
  }

  const payload = await getPayload({
    config,
  })

  const i18n = await initI18n({
    config: config.i18n,
    language,
    translations,
  })
  let collectionConfig: SanitizedCollectionConfig
  let globalConfig: SanitizedGlobalConfig

  if (collectionSlug) {
    collectionConfig = collections.find((collection) => collection.slug === collectionSlug)
  }

  if (globalSlug) {
    globalConfig = globals.find((global) => global.slug === globalSlug)
  }

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const localeCode = localeParam || defaultLocale

  const locale = localization && findLocaleFromCode(localization, localeCode)

  return {
    payload,
    permissions,
    user,
    config,
    i18n,
    collectionConfig,
    globalConfig,
    locale,
  }
}
