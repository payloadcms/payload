export const FIVE_GIB_BYTES = 5 * 1024 * 1024 * 1024
export const DEFAULT_MULTIPART_PART_SIZE = 64 * 1024 * 1024
export const MIN_MULTIPART_PART_SIZE = 5 * 1024 * 1024
export const MULTIPART_CONCURRENCY = 4
export const MAX_PART_RETRIES = 3
export const RETRY_BASE_MS = 500
export const MAX_MULTIPART_PARTS = 10000
export const MAX_SIGNED_URL_EXPIRY = 60 * 60

export const multipartAction = {
  abortMultipart: 'abortMultipart',
  completeMultipart: 'completeMultipart',
  generateSignedURL: 'generateSignedURL',
  initiateMultipart: 'initiateMultipart',
  signMultipartPart: 'signMultipartPart',
} as const
