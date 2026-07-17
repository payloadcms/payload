/**
 * Content API "cloud limit" enforcement errors, surfaced to the admin UI:
 * a modal for the document-count limit, and toasts for the data-size and asset-storage
 * limits. Each is keyed off the stable `code` the Content API returns.
 *
 * TODO: Two upstream dependencies must ship for this to fire end-to-end, and this should be re-verified against real
 * Content API errors afterwards:
 *   1. The @payloadcms/figma plugin must preserve the Content API error `code`/status
 *      instead of flattening it into a generic Error (currently masked to a 500).
 *   2. The plugin's document writes must reach the enforcing Content API endpoints
 *      (document-count + data-size are only enforced on the v1 write pipeline today).
 */
export const cloudLimitErrorCodes = {
  assetStorage: 'cloud_limit.cms_assets_bytes_exceeded',
  documentCount: 'cloud_limit.document_count_exceeded',
  documentDataSize: 'cloud_limit.per_document_data_bytes_exceeded',
} as const

/** TODO: Add translations */
export const cloudLimitToastMessages: Record<string, string> = {
  [cloudLimitErrorCodes.assetStorage]: 'Unable to upload. Free up space to continue.',
  [cloudLimitErrorCodes.documentDataSize]: 'Unable to save document, text is too large',
}

/**
 * Toast copy for the document-count limit. Shown instead of the modal when autosave is
 * enabled, since an autosaving document has no explicit save action to retry.
 */
export const cloudLimitDocumentCountToastMessage =
  'Unable to create document. Storage limit reached.'

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
