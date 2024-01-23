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
import { nextFileUpload } from '../next-fileupload'

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

  let collection: Collection = undefined
  if (params?.collection && collections?.[params.collection]) {
    collection = collections[params.collection]
  }

  const { searchParams, pathname } = new URL(request.url)
  const isGraphQL = !config.graphQL.disable && pathname === `/api${config.routes.graphQL}`

  let requestData
  let requestFile: CustomPayloadRequest['file'] = undefined

  const [contentType] = request.headers.get('Content-Type').split(';')

  if (request.body) {
    if (contentType === 'application/json') {
      requestData = await request.json()
    } else if (contentType === 'multipart/form-data') {
      // possible upload request
      if (collection.config.upload) {
        // load file in memory
        if (!config.upload?.useTempFiles) {
          const formData = await request.formData()
          const file = formData.get('file')

          if (file instanceof Blob) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            requestFile = {
              name: file.name,
              data: buffer,
              mimetype: file.type,
              size: file.size,
            }
          }

          const payloadData = formData.get('_payload')

          if (typeof payloadData === 'string') {
            requestData = JSON.parse(payloadData)
          }
        } else {
          // store temp file on disk
          const { fields, files, error } = await nextFileUpload({
            options: config.upload as any,
            request,
          })

          if (error) {
            throw new Error(error.message)
          }

          if (files?.file) requestFile = files.file

          if (fields?._payload && typeof fields._payload === 'string') {
            requestData = JSON.parse(fields._payload)
          }
        }
      } else {
        // non upload request
        const formData = await request.formData()
        const payloadData = formData.get('_payload')

        if (typeof payloadData === 'string') {
          requestData = JSON.parse(payloadData)
        }
      }
    }
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

  const cookies = parseCookies(request.headers)
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
    data: requestData,
    locale: requestLocale,
    fallbackLocale: requestFallbackLocale,
    i18n,
    t: i18n.t,
    file: requestFile,

    // need to add:
    // ------------
    // - transactionID
    // - findByID
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
