import type { CustomPayloadRequestProperties, PayloadRequest, SanitizedConfig } from 'payload'

import { initI18n } from '@payloadcms/translations'
import {
  executeAuthStrategies,
  getDataLoader,
  getPayload,
  parseCookies,
  sanitizeFallbackLocale,
} from 'payload'
import * as qs from 'qs-esm'
import { URL } from 'url'

import { sanitizeLocales } from './addLocalesToRequest.js'
import { getRequestLanguage } from './getRequestLanguage.js'

type Args = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  params?: {
    collection: string
  }
  request: Request
}

export const createPayloadRequest = async ({
  config: configPromise,
  params,
  request,
}: Args): Promise<PayloadRequest> => {
  const cookies = parseCookies(request.headers)
  const payload = await getPayload({ config: configPromise })

  const { config } = payload
  const localization = config.localization

  const urlProperties = new URL(request.url)
  const { pathname, searchParams } = urlProperties

  const isGraphQL =
    !config.graphQL.disable && pathname === `${config.routes.api}${config.routes.graphQL}`

  const language = getRequestLanguage({
    config,
    cookies,
    headers: request.headers,
  })

  const i18n = await initI18n({
    config: config.i18n,
    context: 'api',
    language,
  })

  const fallbackFromRequest =
    searchParams.get('fallback-locale') || searchParams.get('fallbackLocale')
  let locale = searchParams.get('locale')
  let fallbackLocale = fallbackFromRequest

  const overrideHttpMethod = request.headers.get('X-HTTP-Method-Override')
  const queryToParse = overrideHttpMethod === 'GET' ? await request.text() : urlProperties.search

  const query = queryToParse
    ? qs.parse(queryToParse, {
        arrayLimit: 1000,
        depth: 10,
        ignoreQueryPrefix: true,
      })
    : {}

  if (localization) {
    fallbackLocale = sanitizeFallbackLocale({
      fallbackLocale,
      locale,
      localization,
    })

    const locales = sanitizeLocales({
      fallbackLocale,
      locale,
      localization,
    })

    locale = locales.locale

    // Override if query params are present, in order to respect HTTP method override
    if (query.locale) {
      locale = query.locale as string
    }
  }

  const customRequest: CustomPayloadRequestProperties = {
    context: {},
    fallbackLocale,
    hash: urlProperties.hash,
    host: urlProperties.host,
    href: urlProperties.href,
    i18n,
    locale,
    origin: urlProperties.origin,
    pathname: urlProperties.pathname,
    payload,
    payloadAPI: isGraphQL ? 'GraphQL' : 'REST',
    payloadDataLoader: undefined,
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

  const { responseHeaders, user } = await executeAuthStrategies({
    headers: req.headers,
    isGraphQL,
    payload,
  })

  req.user = user

  if (responseHeaders) {
    req.responseHeaders = responseHeaders
  }

  return req
}
