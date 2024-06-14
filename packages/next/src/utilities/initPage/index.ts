import type { I18nClient } from '@payloadcms/translations'
import type { InitPageResult, Locale, PayloadRequestWithData, VisibleEntities } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { findLocaleFromCode } from '@payloadcms/ui/shared'
import { headers as getHeaders } from 'next/headers.js'
import { createLocalReq, isEntityHidden, parseCookies } from 'payload'
import qs from 'qs'

import type { Args } from './types.js'

import { getPayloadHMR } from '../getPayloadHMR.js'
import { getRequestLanguage } from '../getRequestLanguage.js'
import { handleAdminPage } from './handleAdminPage.js'
import { handleAuthRedirect } from './handleAuthRedirect.js'

export const initPage = async ({
  config: configPromise,
  redirectUnauthenticatedUser = false,
  route,
  searchParams,
}: Args): Promise<InitPageResult> => {
  const headers = getHeaders()
  const payload = await getPayloadHMR({ config: configPromise })

  const {
    collections,
    globals,
    i18n: i18nConfig,
    localization,
    routes: { admin: adminRoute },
  } = payload.config

  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`
  const cookies = parseCookies(headers)
  const language = getRequestLanguage({ config: payload.config, cookies, headers })

  const i18n: I18nClient = await initI18n({
    config: i18nConfig,
    context: 'client',
    language,
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

  const req = await createLocalReq(
    {
      fallbackLocale: null,
      req: {
        host: headers.get('host'),
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

  const localeParam = searchParams?.locale as string
  let locale: Locale

  if (localization) {
    const defaultLocaleCode = localization.defaultLocale ? localization.defaultLocale : 'en'
    let localeCode: string = localeParam

    if (!localeCode) {
      try {
        localeCode = await payload
          .find({
            collection: 'payload-preferences',
            depth: 0,
            limit: 1,
            user,
            where: {
              and: [
                {
                  'user.relationTo': {
                    equals: payload.config.admin.user,
                  },
                },
                {
                  'user.value': {
                    equals: user.id,
                  },
                },
                {
                  key: {
                    equals: 'locale',
                  },
                },
              ],
            },
          })
          ?.then((res) => res.docs?.[0]?.value as string)
      } catch (error) {} // eslint-disable-line no-empty
    }

    locale = findLocaleFromCode(localization, localeCode)

    if (!locale) locale = findLocaleFromCode(localization, defaultLocaleCode)
    req.locale = locale.code
  }

  const visibleEntities: VisibleEntities = {
    collections: collections
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
    globals: globals
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
  }

  if (redirectUnauthenticatedUser && !user) {
    handleAuthRedirect({
      config: payload.config,
      redirectUnauthenticatedUser,
      route,
      searchParams,
    })
  }

  const { collectionConfig, docID, globalConfig } = handleAdminPage({
    adminRoute,
    config: payload.config,
    permissions,
    route,
  })

  return {
    collectionConfig,
    cookies,
    docID,
    globalConfig,
    languageOptions,
    locale,
    permissions,
    req,
    translations: i18n.translations,
    visibleEntities,
  }
}
