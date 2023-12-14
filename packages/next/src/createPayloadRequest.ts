import type { SanitizedConfig, PayloadRequest, CustomPayloadRequest } from 'payload/types'
import { getAuthenticatedUser } from 'payload/auth'
import { PayloadT, getPayload } from 'payload'
import { URL } from 'url'
import { i18nInit } from 'payload/utilities'

type GetRequestLocalesArgs = {
  localization: Exclude<PayloadT['config']['localization'], false>
  requestData?: Record<string, any>
  searchParams?: URLSearchParams
}
function getRequestLocales({ localization, searchParams, requestData }: GetRequestLocalesArgs): {
  locale: string
  fallbackLocale: string
} {
  let locale = searchParams.get('locale')
  let fallbackLocale = searchParams.get('fallback-locale')

  if (requestData) {
    if (requestData?.locale) {
      locale = requestData.locale
    }
    if (requestData?.['fallback-locale']) {
      fallbackLocale = requestData['fallback-locale']
    }
  }

  if (fallbackLocale === 'none') {
    fallbackLocale = 'null'
  } else if (!localization.localeCodes.includes(fallbackLocale)) {
    fallbackLocale = localization.defaultLocale
  }

  if (locale === '*') {
    locale = 'all'
  } else if (!localization.localeCodes.includes(locale)) {
    locale = localization.defaultLocale
  }

  return {
    locale,
    fallbackLocale,
  }
}

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
  const payload = await getPayload({ config: configPromise })
  const { collections, config } = payload

  let collection = undefined
  if (params?.collection && collections?.[params.collection]) {
    collection = collections[params.collection]
  }

  const { searchParams, pathname } = new URL(request.url)
  const isGraphQL = !config.graphQL.disable && pathname === `/api${config.routes.graphQL}`

  let requestData
  if (request.body && request.headers.get('Content-Type') === 'application/json') {
    requestData = await request.json()
  }

  let requestFallbackLocale
  let requestLocale
  if (config.localization) {
    const locales = getRequestLocales({
      localization: config.localization,
      searchParams,
      requestData,
    })
    requestLocale = locales.locale
    requestFallbackLocale = locales.fallbackLocale
  }

  const i18n = i18nInit(config.i18n)

  const customRequest: CustomPayloadRequest = {
    payload,
    user: null,
    context: {},
    collection,
    payloadAPI: isGraphQL ? 'GraphQL' : 'REST',
    data: requestData,
    locale: requestLocale,
    fallbackLocale: requestFallbackLocale,
    i18n: i18n, // TODO(REVIEW): is this correct?
    t: i18n.t, // TODO(REVIEW): is this correct?

    // need to add:
    // ------------
    // - transactionID
    // - findByID
    // - payloadDataLoader
    // - payloadUploadSizes
    // - files
  }

  const req: PayloadRequest = Object.assign(request, customRequest)

  req.user = getAuthenticatedUser({
    payload,
    headers: req.headers,
    searchParams,
    isGraphQL,
  })

  return req
}

// Express specific functionality
// to search for and replace:
// -------------------------------
// req.params
// req.query
// req.body
// req.files
// express/responses/formatSuccess
