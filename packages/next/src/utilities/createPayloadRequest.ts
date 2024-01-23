import type {
  SanitizedConfig,
  PayloadRequest,
  CustomPayloadRequest,
  Collection,
} from 'payload/types'
import { getAuthenticatedUser } from 'payload/auth'
import { getPayload } from 'payload'
import { URL } from 'url'
import { parseCookies } from './cookies'
import { getRequestLanguage } from './getRequestLanguage'
import { getRequestLocales } from './getRequestLocales'
import { getNextI18n } from './getNextI18n'
import { getDataAndFiles } from './getDataAndFiles'

type Args = {
  request: Request
  config: Promise<SanitizedConfig>
  params?: {
    collection: string
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

  const { data, file } = await getDataAndFiles({
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

  const i18n = getNextI18n({
    config,
    language,
    translationContext: 'api',
  })

  const customRequest: CustomPayloadRequest = {
    payload,
    user: null,
    context: {},
    collection,
    payloadAPI: isGraphQL ? 'GraphQL' : 'REST',
    data,
    locale: requestLocale,
    fallbackLocale: requestFallbackLocale,
    i18n,
    t: i18n.t,
    file,

    // need to add:
    // ------------
    // - transactionID
    // - payloadDataLoader
    // - payloadUploadSizes
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
