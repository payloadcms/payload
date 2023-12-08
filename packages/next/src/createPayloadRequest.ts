import type { SanitizedConfig, PayloadRequest, CustomPayloadRequest } from 'payload/types'
import { getAuthenticatedUser } from 'payload/auth'
import { getPayload } from 'payload'
import { URL } from 'url'

type Args = {
  request: Request
  config: Promise<SanitizedConfig>
  params?: {
    collection: string
  }
}

export const createPayloadRequest = async ({
  request,
  config,
  params,
}: Args): Promise<PayloadRequest> => {
  const payload = await getPayload({ config })

  let collection = undefined
  if (params?.collection && payload.collections?.[params.collection]) {
    collection = payload.collections[params.collection]
  }

  const { searchParams, pathname } = new URL(request.url)
  const isGraphQL =
    !payload.config.graphQL.disable && pathname === `/api${payload.config.routes.graphQL}`

  const customRequest: CustomPayloadRequest = {
    payload,
    user: null,
    context: {},
    collection,
    payloadAPI: isGraphQL ? 'GraphQL' : 'REST',

    // need to add:
    // ------------
    // - locale
    // - fallbackLocale
    // - context
    // - transactionID
    // - findByID
    // - i18n
    // - payloadDataLoader
    // - payloadUploadSizes
    // - t
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
