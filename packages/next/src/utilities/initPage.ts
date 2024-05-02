import type {
  InitPageResult,
  PayloadRequestWithData,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  VisibleEntities,
} from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { findLocaleFromCode } from '@payloadcms/ui/utilities/findLocaleFromCode'
import { headers as getHeaders } from 'next/headers.js'
import { notFound, redirect } from 'next/navigation.js'
import { parseCookies } from 'payload/auth'
import { createLocalReq, isEntityHidden } from 'payload/utilities'
import qs from 'qs'

import { getPayloadHMR } from '../utilities/getPayloadHMR.js'
import { getRequestLanguage } from './getRequestLanguage.js'

type Args = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  redirectUnauthenticatedUser?: boolean
  route: string
  searchParams: { [key: string]: string | string[] | undefined }
}

const authRoutes = [
  '/login',
  '/logout',
  '/create-first-user',
  '/forgot',
  '/reset',
  '/verify',
  '/logout-inactivity',
]

export const initPage = async ({
  config: configPromise,
  redirectUnauthenticatedUser = false,
  route,
  searchParams,
}: Args): Promise<InitPageResult> => {
  const headers = getHeaders()
  const localeParam = searchParams?.locale as string
  const payload = await getPayloadHMR({ config: configPromise })
  const { collections, globals, localization, routes } = payload.config

  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`
  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'
  const localeCode = localeParam || defaultLocale
  const locale = localization && findLocaleFromCode(localization, localeCode)
  const cookies = parseCookies(headers)
  const language = getRequestLanguage({ config: payload.config, cookies, headers })

  const i18n = await initI18n({
    config: payload.config.i18n,
    context: 'client',
    language,
  })

  const req = await createLocalReq(
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
      } as PayloadRequestWithData,
    },
    payload,
  )

  const { permissions, user } = await payload.auth({ headers, req })

  req.user = user

  const visibleEntities: VisibleEntities = {
    collections: payload.config.collections
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
    globals: payload.config.globals
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
  }

  const {
    routes: { admin: adminRoute },
  } = payload.config

  const routeSegments = route.replace(adminRoute, '').split('/').filter(Boolean)
  const [entityType, entitySlug, createOrID] = routeSegments
  const collectionSlug = entityType === 'collections' ? entitySlug : undefined
  const globalSlug = entityType === 'globals' ? entitySlug : undefined
  const docID = collectionSlug && createOrID !== 'create' ? createOrID : undefined

  const isAdminRoute = route.startsWith(adminRoute)
  const isAuthRoute = authRoutes.some((r) => route.replace(adminRoute, '').startsWith(r))

  if (redirectUnauthenticatedUser && !user && !isAuthRoute) {
    if (searchParams && 'redirect' in searchParams) delete searchParams.redirect

    const stringifiedSearchParams = Object.keys(searchParams ?? {}).length
      ? `?${qs.stringify(searchParams)}`
      : ''

    redirect(`${routes.admin}/login?redirect=${route + stringifiedSearchParams}`)
  }

  if (!permissions.canAccessAdmin && isAdminRoute && !isAuthRoute) {
    notFound()
  }

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
