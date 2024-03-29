import type {
  InitPageResult,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  VisibleEntities,
} from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { findLocaleFromCode } from '@payloadcms/ui/utilities/findLocaleFromCode'
import { headers as getHeaders } from 'next/headers.js'
import { notFound, redirect } from 'next/navigation.js'
import { createLocalReq, isEntityHidden } from 'payload/utilities'
import qs from 'qs'

import { getPayloadHMR } from '../utilities/getPayloadHMR.js'
import { auth } from './auth.js'
import { getRequestLanguage } from './getRequestLanguage.js'

type Args = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  redirectUnauthenticatedUser?: boolean
  route?: string
  searchParams?: { [key: string]: string | string[] | undefined }
}

export const initPage = async ({
  config: configPromise,
  redirectUnauthenticatedUser = false,
  route,
  searchParams,
}: Args): Promise<InitPageResult> => {
  const headers = getHeaders()
  const localeParam = searchParams?.locale as string
  const payload = await getPayloadHMR({ config: configPromise })

  const { cookies, permissions, user } = await auth({
    headers,
    payload,
  })

  const visibleEntities: VisibleEntities = {
    collections: payload.config.collections
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
    globals: payload.config.globals
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
  }

  const routeSegments = route.replace(payload.config.routes.admin, '').split('/').filter(Boolean)
  const [entityType, entitySlug, createOrID] = routeSegments
  const collectionSlug = entityType === 'collections' ? entitySlug : undefined
  const globalSlug = entityType === 'globals' ? entitySlug : undefined
  const docID = collectionSlug && createOrID !== 'create' ? createOrID : undefined

  const { collections, globals, localization, routes } = payload.config

  if (redirectUnauthenticatedUser && !user && route !== '/login') {
    if ('redirect' in searchParams) delete searchParams.redirect

    const stringifiedSearchParams = Object.keys(searchParams ?? {}).length
      ? `?${qs.stringify(searchParams)}`
      : ''

    redirect(`${routes.admin}/login?redirect=${route + stringifiedSearchParams}`)
  }

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'
  const localeCode = localeParam || defaultLocale
  const locale = localization && findLocaleFromCode(localization, localeCode)
  const language = getRequestLanguage({ config: payload.config, cookies, headers })

  const i18n = initI18n({
    config: payload.config.i18n,
    context: 'client',
    language,
    translations,
  })

  const queryString = `${qs.stringify(searchParams, { addQueryPrefix: true })}`

  const req = createLocalReq(
    {
      fallbackLocale: null,
      locale: locale.code,
      req: {
        i18n,
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
        url: `${payload.config.serverURL}${route}${searchParams ? queryString : ''}`,
      } as PayloadRequest,
      user,
    },
    payload,
  )

  let collectionConfig: SanitizedCollectionConfig
  let globalConfig: SanitizedGlobalConfig

  if (collectionSlug) {
    collectionConfig = collections.find((collection) => collection.slug === collectionSlug)

    if (!collectionConfig) {
      notFound()
    }
  }

  if (globalSlug) {
    globalConfig = globals.find((global) => global.slug === globalSlug)

    if (!globalConfig) {
      notFound()
    }
  }

  return {
    collectionConfig,
    cookies,
    docID,
    globalConfig,
    locale,
    permissions,
    req,
    translations: i18n.translations,
    visibleEntities,
  }
}
