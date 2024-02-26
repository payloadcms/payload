import type {
  Collection,
  CustomPayloadRequest,
  PayloadRequest,
  SanitizedConfig,
} from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/api'
import { getPayload } from 'payload'
import { getAuthenticatedUser } from 'payload/auth'
import { parseCookies } from 'payload/auth'
import { getDataLoader } from 'payload/utilities'
import { URL } from 'url'

import { getDataAndFile } from './getDataAndFile'
import { getRequestLanguage } from './getRequestLanguage'
import { getRequestLocales } from './getRequestLocales'

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
  const { collections, config } = payload

  let collection: Collection = undefined
  if (params?.collection && collections?.[params.collection]) {
    collection = collections[params.collection]
  }

  const urlProperties = new URL(request.url)
  const { pathname, searchParams } = urlProperties

  const isGraphQL =
    !config.graphQL.disable && pathname === `${config.routes.api}${config.routes.graphQL}`

  const { data, file } = await getDataAndFile({
    collection,
    config,
    request,
  })

  let requestFallbackLocale
  let requestLocale

  if (config.localization) {
    const locales = getRequestLocales({
      data,
      localization: config.localization,
      searchParams,
    })
    requestLocale = locales.locale
    requestFallbackLocale = locales.fallbackLocale
  }

  const language = getRequestLanguage({
    cookies,
    headers: request.headers,
  })

  const i18n = await initI18n({
    config: config.i18n,
    context: 'api',
    language,
    translations,
  })

  const customRequest: CustomPayloadRequest = {
    context: {},
    data,
    fallbackLocale: requestFallbackLocale,
    file,
    hash: urlProperties.hash,
    host: urlProperties.host,
    href: urlProperties.href,
    i18n,
    locale: requestLocale,
    origin: urlProperties.origin,
    pathname: urlProperties.pathname,
    payload,
    payloadAPI: isGraphQL ? 'GraphQL' : 'REST',
    payloadDataLoader: undefined,
    payloadUploadSizes: {},
    port: urlProperties.port,
    protocol: urlProperties.protocol,
    routeParams: params || {},
    search: urlProperties.search,
    searchParams: urlProperties.searchParams,
    t: i18n.t,
    transactionID: undefined,
    user: null,
  }

  const req: PayloadRequest = Object.assign(request, customRequest)
  req.payloadDataLoader = getDataLoader(req)

  req.user = await getAuthenticatedUser({
    cookies,
    headers: req.headers,
    isGraphQL,
    payload,
  })

  return req
}
