import { initI18n } from '@payloadcms/translations'
import * as qs from 'qs-esm'

import type { SanitizedConfig } from '../config/types.js'
import type { TypedFallbackLocale } from '../index.js'
import type { CustomPayloadRequestProperties, PayloadRequest } from '../types/index.js'

import { executeAuthStrategies } from '../auth/executeAuthStrategies.js'
import { getDataLoader } from '../collections/dataloader.js'
import { getPayload } from '../index.js'
import { sanitizeLocales } from './addLocalesToRequest.js'
import { formatAdminURL } from './formatAdminURL.js'
import { getRequestLanguage } from './getRequestLanguage.js'
import { parseCookies } from './parseCookies.js'

type Args = {
  canSetHeaders?: boolean
  config: Promise<SanitizedConfig> | SanitizedConfig
  params?: {
    collection: string
  }
  payloadInstanceCacheKey?: string
  request: Request
}

export const createPayloadRequest = async ({
  canSetHeaders,
  config: configPromise,
  params,
  payloadInstanceCacheKey,
  request,
}: Args): Promise<PayloadRequest> => {
  const _log = (m: string) => console.log(`[createPayloadRequest] ${m}`)

  _log('start')

  const cookies = parseCookies(request.headers)

  _log('getPayload start')
  const payload = await getPayload({
    config: configPromise,
    cron: true,
    key: payloadInstanceCacheKey,
  })
  _log('getPayload done')

  const { config } = payload
  const localization = config.localization

  const urlProperties = new URL(request.url)
  const { pathname, searchParams } = urlProperties

  const isGraphQL =
    !config.graphQL.disable &&
    pathname ===
      formatAdminURL({
        apiRoute: config.routes.api,
        path: config.routes.graphQL as `/${string}`,
      })

  const language = getRequestLanguage({
    config,
    cookies,
    headers: request.headers,
  })

  _log('initI18n start')
  const i18n = await initI18n({
    config: config.i18n,
    context: 'api',
    language,
  })
  _log('initI18n done')

  let locale = searchParams.get('locale')

  const { search: queryToParse } = urlProperties

  const query = queryToParse
    ? qs.parse(queryToParse, {
        arrayLimit: 1000,
        depth: 10,
        ignoreQueryPrefix: true,
      })
    : {}

  const fallbackFromRequest = (query.fallbackLocale ||
    searchParams.get('fallback-locale') ||
    searchParams.get('fallbackLocale')) as TypedFallbackLocale

  let fallbackLocale = fallbackFromRequest

  if (localization) {
    const locales = sanitizeLocales({
      fallbackLocale: fallbackLocale!,
      locale: locale!,
      localization,
    })

    fallbackLocale = locales.fallbackLocale!
    locale = locales.locale!
  }

  const customRequest: CustomPayloadRequestProperties = {
    context: {},
    fallbackLocale: fallbackLocale!,
    hash: urlProperties.hash,
    host: urlProperties.host,
    href: urlProperties.href,
    i18n,
    locale,
    origin: urlProperties.origin,
    pathname: urlProperties.pathname,
    payload,
    payloadAPI: isGraphQL ? 'GraphQL' : 'REST',
    payloadDataLoader: undefined!,
    payloadUploadSizes: {},
    port: urlProperties.port,
    protocol: urlProperties.protocol,
    query,
    routeParams: params || {},
    search: urlProperties.search,
    searchParams: urlProperties.searchParams,
    t: i18n.t,
    transactionID: undefined,
    user: null,
  }

  const req: PayloadRequest = Object.assign(request, customRequest)

  req.payloadDataLoader = getDataLoader(req)

  _log('executeAuthStrategies start')
  const { responseHeaders, user } = await executeAuthStrategies({
    canSetHeaders,
    headers: req.headers,
    isGraphQL,
    payload,
  })
  _log('executeAuthStrategies done')

  req.user = user

  if (responseHeaders) {
    req.responseHeaders = responseHeaders
  }

  _log('done')
  return req
}
