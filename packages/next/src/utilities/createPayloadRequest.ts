import type {
  SanitizedConfig,
  PayloadRequest,
  CustomPayloadRequest,
  Collection,
} from 'payload/types'
import { getAuthenticatedUser } from 'payload/auth'
import { getPayload } from 'payload'
import { URL } from 'url'
import { parseCookies } from 'payload/auth'
import { initI18n } from '@payloadcms/translations'
import { getRequestLanguage } from './getRequestLanguage'
import { getRequestLocales } from './getRequestLocales'
import { getDataAndFile } from './getDataAndFile'

type Args = {
  request: Request
  config: Promise<SanitizedConfig>
  params?: {
    collection: string
    id?: string
  }
}

export const createPayloadRequest = async ({
  request,
  config: configPromise,
  params,
}: Args): Promise<PayloadRequest> => {
  const cookies = parseCookies(request.headers)
  const payload = await getPayload({ config: configPromise })
  const { collections, config } = payload

  let collection: Collection = undefined
  if (params?.collection && collections?.[params.collection]) {
    collection = collections[params.collection]
  }

  const { searchParams, pathname } = new URL(request.url)
  const isGraphQL = !config.graphQL.disable && pathname === `/api${config.routes.graphQL}`

  const { data, file } = await getDataAndFile({
    request,
    collection,
    config,
  })

  let requestFallbackLocale
  let requestLocale
  if (config.localization) {
    const locales = getRequestLocales({
      localization: config.localization,
      searchParams,
      data,
    })
    requestLocale = locales.locale
    requestFallbackLocale = locales.fallbackLocale
  }

  const language = getRequestLanguage({
    headers: request.headers,
    cookies,
  })

  const i18n = await initI18n({
    config: config.i18n,
    language,
    translationsContext: 'api',
  })

  const customRequest: CustomPayloadRequest = {
    payload,
    user: null,
    context: {},
    payloadAPI: isGraphQL ? 'GraphQL' : 'REST',
    data,
    locale: requestLocale,
    fallbackLocale: requestFallbackLocale,
    i18n,
    t: i18n.t,
    file,
    transactionID: undefined,
    payloadDataLoader: undefined,
    payloadUploadSizes: {},
    params,
    searchParams,
    pathname,
  }

  const req: PayloadRequest = Object.assign(request, customRequest)

  req.user = await getAuthenticatedUser({
    payload,
    headers: req.headers,
    isGraphQL,
    cookies,
  })

  return req
}
