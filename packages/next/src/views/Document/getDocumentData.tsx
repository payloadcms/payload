import type {
  Data,
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload/types'

export const getDocumentData = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  locale: Locale
  payload: Payload
  req: PayloadRequest
}): Promise<Data> => {
  const { id, collectionConfig, globalConfig, locale, payload, req } = args

  let data: Data

  if (collectionConfig && id !== undefined && id !== null) {
    data = await payload.findByID({
      id,
      collection: collectionConfig.slug,
      depth: 0,
      locale: locale.code,
      req,
    })
  }

  if (globalConfig) {
    data = await payload.findGlobal({
      slug: globalConfig.slug,
      depth: 0,
      locale: locale.code,
      req,
    })
  }

  return data
}
