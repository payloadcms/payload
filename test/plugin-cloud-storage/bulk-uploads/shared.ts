import type { PayloadRequest } from 'payload'

export const mediaSlug = 'bulk-cloud-media'
export const storedFiles = new Map<string, Buffer>()
export const outerRequests: Array<Pick<PayloadRequest, 'context' | 'file' | 'query'>> = []
export const controls: {
  onMetadataUpdate?: () => Promise<void>
  onOuterUpdate?: () => void
} = {}
