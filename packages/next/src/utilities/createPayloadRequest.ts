import type {
  Collection,
  CustomPayloadRequest,
  PayloadRequest,
  SanitizedConfig,
} from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/api'
import { getAuthenticatedUser } from 'payload/auth'
import { parseCookies } from 'payload/auth'
import { getDataLoader } from 'payload/utilities'
import qs from 'qs'
import { URL } from 'url'

import { getDataAndFile } from './getDataAndFile.js'
import { getPayloadHMR } from './getPayloadHMR.js'
import { getRequestLanguage } from './getRequestLanguage.js'
import { getRequestLocales } from './getRequestLocales.js'

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
  const payload = await getPayloadHMR({ config: configPromise })

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
    config,
    cookies,
    headers: request.headers,
  })

  const i18n = initI18n({
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
    query: urlProperties.search
      ? qs.parse(urlProperties.search, {
          arrayLimit: 1000,
          depth: 10,
          ignoreQueryPrefix: true,
        })
      : {},
    routeParams: params || {},
    search: urlProperties.search,
    searchParams: urlProperties.searchParams,
    t: i18n.t,
    transactionID: undefined,
    user: null,
  }

  const req: PayloadRequest = Object.assign(request, customRequest)

  req.json = () => Promise.resolve(data)

  req.payloadDataLoader = getDataLoader(req)

  req.user = await getAuthenticatedUser({
    cookies,
    headers: req.headers,
    isGraphQL,
    payload,
  })

  return req
}
