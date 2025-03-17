// @ts-strict-ignore
import { initI18n } from '@payloadcms/translations'
import * as qs from 'qs-esm'

import type { SanitizedConfig } from '../config/types.js'
import type { CustomPayloadRequestProperties, PayloadRequest } from '../types/index.js'

import { executeAuthStrategies } from '../auth/executeAuthStrategies.js'
import { getDataLoader } from '../collections/dataloader.js'
import { getPayload } from '../index.js'
import { sanitizeLocales } from './addLocalesToRequest.js'
import { getRequestLanguage } from './getRequestLanguage.js'
import { parseCookies } from './parseCookies.js'

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

  const { search: queryToParse } = urlProperties

  const query = queryToParse
    ? qs.parse(queryToParse, {
        arrayLimit: 1000,
        depth: 10,
        ignoreQueryPrefix: true,
      })
    : {}

  if (localization) {
    const locales = sanitizeLocales({
      fallbackLocale,
      locale,
      localization,
    })

    fallbackLocale = locales.fallbackLocale
    locale = locales.locale
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
