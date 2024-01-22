import type { SanitizedConfig, PayloadRequest, CustomPayloadRequest } from 'payload/types'
import { getAuthenticatedUser } from 'payload/auth'
import { getPayload } from 'payload'
import { URL } from 'url'
import { parseCookies } from './cookies'
import { getRequestLanguage } from './getRequestLanguage'
import { getRequestLocales } from './getRequestLocales'
import { getNextI18n } from './getNextI18n'
import fs from 'fs'
import path from 'path'
import busboy from 'busboy'

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
  let requestFile: CustomPayloadRequest['file'] = undefined

  const [contentType, ...contentTypeVarStrings] = request.headers.get('Content-Type').split(';')
  const boundaryString = contentTypeVarStrings
    .find((varString) => varString.includes('boundary'))
    ?.split('=')?.[1]
    ?.trim()

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

          if (file && file instanceof File) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            requestFile.name = file.name
            requestFile.data = buffer
            requestFile.mimetype = file.type
            requestFile.size = file.size
          }

          const payloadData = formData.get('_payload')

          if (typeof payloadData === 'string') {
            requestData = JSON.parse(payloadData)
          }
        } else {
          // store temp file on disk
          const headersObject = {}
          request.headers.forEach((value, name) => {
            headersObject[name] = value
          })

          const saveToFolder = path.join(process.cwd(), config.upload.tempFileDir)

          if (!fs.existsSync(saveToFolder)) {
            fs.mkdirSync(saveToFolder)
          }

          const bb = busboy({ headers: headersObject })

          bb.on('file', (fieldname, file, info) => {
            const { filename, encoding, mimeType: mime } = info
            const saveTo = path.join(process.cwd(), 'tmp', filename)
            const writeStream = fs.createWriteStream(saveTo)

            file.on('data', (data) => {
              writeStream.write(data)
            })

            file.on('end', () => {
              writeStream.end()
            })
          })

          const reader = request.body.getReader()
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              return
            }

            bb.write(value)
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
    // - files
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
