import { headers as getHeaders } from 'next/headers'
import qs from 'qs'

import { auth } from './auth'

import { getPayload } from 'payload'
import type {
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'
import { redirect } from 'next/navigation'
import { Permissions, parseCookies } from 'payload/auth'
import { getRequestLanguage } from './getRequestLanguage'
import { findLocaleFromCode } from '../../../ui/src/utilities/findLocaleFromCode'
import type { I18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { initI18n } from '@payloadcms/translations'

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
  const language = getRequestLanguage({ cookies, headers })
  const config = await configPromise
  const payload = await getPayload({ config })

  const { localization, routes, collections, globals } = config

  const i18n = await initI18n({
    config: config.i18n,
    language,
    translations,
    context: 'client',
  })

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'
  const localeCode = localeParam || defaultLocale
  const locale = localization && findLocaleFromCode(localization, localeCode)

  const partialReq: Partial<PayloadRequest> = {
    user: null,
    payload,
    payloadAPI: 'REST',
    headers,
    i18n,
    t: i18n.t,
    locale: locale ? locale?.code : undefined,
    fallbackLocale: locale ? locale?.fallbackLocale : undefined,
    context: {},
  }

  const { permissions, user } = await auth({
    headers,
    cookies,
    i18n,
    partialReq,
  })

  if (redirectUnauthenticatedUser && !user && route !== '/login') {
    const stringifiedSearchParams = Object.keys(searchParams ?? {}).length
      ? `?${qs.stringify(searchParams)}`
      : ''

    redirect(`${routes.admin}/login?redirect=${routes.admin + route + stringifiedSearchParams}`)
  }

  let collectionConfig: SanitizedCollectionConfig
  let globalConfig: SanitizedGlobalConfig

  if (collectionSlug) {
    collectionConfig = collections.find((collection) => collection.slug === collectionSlug)
  }

  if (globalSlug) {
    globalConfig = globals.find((global) => global.slug === globalSlug)
  }

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
