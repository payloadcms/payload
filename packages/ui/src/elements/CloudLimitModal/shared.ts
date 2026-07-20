import type { ClientTranslationKeys } from '@payloadcms/translations'

export const cloudLimitErrorCodes = {
  assetStorage: 'cloud_limit.cms_assets_bytes_exceeded',
  documentCount: 'cloud_limit.document_count_exceeded',
  documentDataSize: 'cloud_limit.per_document_data_bytes_exceeded',
} as const

export const cloudLimitToastMessageKeys: Partial<Record<string, ClientTranslationKeys>> = {
  [cloudLimitErrorCodes.assetStorage]: 'usageLimits:unableToUpload',
  [cloudLimitErrorCodes.documentDataSize]: 'usageLimits:unableToSaveDocumentTooLarge',
}

export const cloudLimitDocumentCountToastMessageKey: ClientTranslationKeys =
  'usageLimits:unableToCreateDocument'

export const cloudLimitDocumentCountModalSlug = 'cloud-limit-document-count'

export const formatCloudLimitDocumentCountModalSlug = (editDepth: number): string =>
  `${cloudLimitDocumentCountModalSlug}-${editDepth}`

const knownCloudLimitCodes = Object.values(cloudLimitErrorCodes) as string[]

export function isCloudLimitErrorCode(code: unknown): code is string {
  return typeof code === 'string' && knownCloudLimitCodes.includes(code)
}

type CloudLimitErrorJSON = {
  errors?: Array<{ data?: { code?: string } | null } | null> | null
}

export function getCloudLimitErrorCode(json: CloudLimitErrorJSON): string | undefined {
  return json?.errors?.map((err) => err?.data?.code).find(isCloudLimitErrorCode)
}

export function getCloudLimitErrorCodeFromError(error: unknown): string | undefined {
  const code = (error as { data?: { code?: unknown } } | null | undefined)?.data?.code

  return isCloudLimitErrorCode(code) ? code : undefined
}
