import type { InitPageResult, VisibleEntities } from 'payload'

import { headers as getHeaders } from 'next/headers.js'
import { notFound } from 'next/navigation.js'
import { getPayload, isEntityHidden, parseCookies } from 'payload'
import * as qs from 'qs-esm'

import type { Args } from './types.js'

import { initReq } from '../initReq.js'
import { getRouteInfo } from './handleAdminPage.js'
import { handleAuthRedirect } from './handleAuthRedirect.js'
import { isCustomAdminView } from './isCustomAdminView.js'
import { isPublicAdminRoute } from './shared.js'

export const initPage = async ({
  config: configPromise,
  importMap,
  route,
  searchParams,
}: Args): Promise<InitPageResult> => {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise, importMap })
  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`

  const {
    collections,
    globals,
    routes: { admin: adminRoute },
  } = payload.config

  const cookies = parseCookies(headers)

  const { locale, permissions, req } = await initReq(payload.config, {
    fallbackLocale: false,
    req: {
      headers,
      query: qs.parse(queryString, {
        depth: 10,
        ignoreQueryPrefix: true,
      }),
      url: `${payload.config.serverURL}${route}${searchParams ? queryString : ''}`,
    },
  })

  const languageOptions = Object.entries(payload.config.i18n.supportedLanguages || {}).reduce(
    (acc, [language, languageConfig]) => {
      if (Object.keys(payload.config.i18n.supportedLanguages).includes(language)) {
        acc.push({
          label: languageConfig.translations.general.thisLanguage,
          value: language,
        })
      }

      return acc
    },
    [],
  )

  const visibleEntities: VisibleEntities = {
    collections: collections
      .map(({ slug, admin: { hidden } }) =>
        !isEntityHidden({ hidden, user: req.user }) ? slug : null,
      )
      .filter(Boolean),
    globals: globals
      .map(({ slug, admin: { hidden } }) =>
        !isEntityHidden({ hidden, user: req.user }) ? slug : null,
      )
      .filter(Boolean),
  }

  let redirectTo = null

  if (
    !permissions.canAccessAdmin &&
    !isPublicAdminRoute({ adminRoute, config: payload.config, route }) &&
    !isCustomAdminView({ adminRoute, config: payload.config, route })
  ) {
    redirectTo = handleAuthRedirect({
      config: payload.config,
      route,
      searchParams,
      user: req.user,
    })
  }

  const { collectionConfig, collectionSlug, docID, globalConfig, globalSlug } = getRouteInfo({
    adminRoute,
    config: payload.config,
    defaultIDType: payload.db.defaultIDType,
    payload,
    route,
  })

  if ((collectionSlug && !collectionConfig) || (globalSlug && !globalConfig)) {
    return notFound()
  }

  return {
    collectionConfig,
    cookies,
    docID,
    globalConfig,
    languageOptions,
    locale,
    permissions,
    redirectTo,
    req,
    translations: req.i18n.translations,
    visibleEntities,
  }
}
