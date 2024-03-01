import type { Permissions } from 'payload/auth'
import type { Locale } from 'payload/config'
import type {
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { findLocaleFromCode } from '@payloadcms/ui'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { createLocalReq } from 'payload/utilities'
import qs from 'qs'

import { auth } from './auth'
import { getRequestLanguage } from './getRequestLanguage'

type Args = {
  collectionSlug?: string
  config: Promise<SanitizedConfig> | SanitizedConfig
  globalSlug?: string
  localeParam?: string
  redirectUnauthenticatedUser?: boolean
  route?: string
  searchParams?: { [key: string]: string | string[] | undefined }
}

export type InitPageResult = {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  locale: Locale
  permissions: Permissions
  req: PayloadRequest
}

export const initPage = async ({
  collectionSlug,
  config: configPromise,
  globalSlug,
  localeParam,
  redirectUnauthenticatedUser = false,
  route,
  searchParams,
}: Args): Promise<InitPageResult> => {
  const headers = getHeaders()

  const { cookies, permissions, user } = await auth({
    config: configPromise,
    headers,
  })

  const config = await configPromise

  const { collections, globals, localization, routes } = config

  if (redirectUnauthenticatedUser && !user && route !== '/login') {
    const stringifiedSearchParams = Object.keys(searchParams ?? {}).length
      ? `?${qs.stringify(searchParams)}`
      : ''

    redirect(`${routes.admin}/login?redirect=${routes.admin + route + stringifiedSearchParams}`)
  }

  const payload = await getPayload({ config })

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'
  const localeCode = localeParam || defaultLocale
  const locale = localization && findLocaleFromCode(localization, localeCode)
  const language = getRequestLanguage({ cookies, headers })
  const i18n = initI18n({
    config: config.i18n,
    context: 'client',
    language,
    translations,
  })

  const req = await createLocalReq(
    {
      fallbackLocale: null,
      locale: locale.code,
      req: {
        i18n,
      } as PayloadRequest,
      user,
    },
    payload,
  )

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
    globalConfig,
    locale,
    permissions,
    req,
  }
}
