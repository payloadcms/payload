import type { UploadSessionTransferConfig } from './types.js'

export const defaultTransferConfig: Required<UploadSessionTransferConfig> = {
  concurrency: 4,
  multipartThreshold: 64 * 1024 * 1024,
  preferredSegmentSize: 16 * 1024 * 1024,
  retries: 5,
}
