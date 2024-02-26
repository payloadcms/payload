import type { I18n } from '@payloadcms/translations'
import type { Permissions } from 'payload/auth'
import type {
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { parseCookies } from 'payload/auth'
import qs from 'qs'

import { findLocaleFromCode } from '../../../ui/src/utilities/findLocaleFromCode'
import { auth } from './auth'
import { getRequestLanguage } from './getRequestLanguage'

export const initPage = async ({
  collectionSlug,
  config: configPromise,
  globalSlug,
  localeParam,
  redirectUnauthenticatedUser = false,
  route,
  searchParams,
}: {
  collectionSlug?: string
  config: Promise<SanitizedConfig> | SanitizedConfig
  globalSlug?: string
  localeParam?: string
  redirectUnauthenticatedUser?: boolean
  route?: string
  searchParams?: { [key: string]: string | string[] | undefined }
}): Promise<{
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  locale: ReturnType<typeof findLocaleFromCode>
  payload: Awaited<ReturnType<typeof getPayload>>
  permissions: Permissions
  user: Awaited<ReturnType<typeof auth>>['user']
}> => {
  const headers = getHeaders()
  const cookies = parseCookies(headers)

  const { permissions, user } = await auth({
    config: configPromise,
    cookies,
    headers,
  })

  const language = getRequestLanguage({ cookies, headers })

  const config = await configPromise

  const { collections, globals, localization, routes } = config

  if (redirectUnauthenticatedUser && !user && route !== '/login') {
    const stringifiedSearchParams = Object.keys(searchParams ?? {}).length
      ? `?${qs.stringify(searchParams)}`
      : ''

    redirect(`${routes.admin}/login?redirect=${routes.admin + route + stringifiedSearchParams}`)
  }

  const payload = await getPayload({
    config,
  })

  const i18n = await initI18n({
    config: config.i18n,
    context: 'all',
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
    collectionConfig,
    config,
    globalConfig,
    i18n,
    locale,
    payload,
    permissions,
    user,
  }
}
