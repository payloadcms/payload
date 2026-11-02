import type { SegmentedUploadLimits, UploadSegment, UploadSessionTransferConfig } from './types.js'

import { APIError } from '../../errors/APIError.js'
import { defaultTransferConfig } from './defaults.js'

/**
 * Splits a file into frozen byte ranges that satisfy the provider limits. Preferences resolve as
 * collection override, then global override, then the adapter recommendation, then the core
 * default; provider limits always win over all of them.
 */
export const planSegments = ({
  collectionTransfer,
  globalTransfer,
  limits,
  size,
}: {
  collectionTransfer?: UploadSessionTransferConfig
  globalTransfer?: UploadSessionTransferConfig
  limits: SegmentedUploadLimits
  size: number
}): { concurrency: number; segments: UploadSegment[]; segmentSize: number } => {
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new APIError('Segmented uploads require a non-empty file with a known size.', 400)
  }

  if (size > limits.maximumObjectSize) {
    throw new APIError('File is larger than the storage provider allows.', 400)
  }

  const preferredSegmentSize =
    collectionTransfer?.preferredSegmentSize ??
    globalTransfer?.preferredSegmentSize ??
    limits.recommendedSegmentSize ??
    defaultTransferConfig.preferredSegmentSize

  const minimumRequiredSize = Math.ceil(size / limits.maximumSegmentCount)

  const segmentSize = roundUpToGranularity({
    granularity: limits.segmentSizeGranularity,
    value: Math.max(preferredSegmentSize, minimumRequiredSize, limits.minimumSegmentSize),
  })

  if (segmentSize > limits.maximumSegmentSize) {
    throw new APIError('File cannot be split within the storage provider segment limits.', 400)
  }

  const segments: UploadSegment[] = []

  for (let start = 0; start < size; start += segmentSize) {
    segments.push({ end: Math.min(start + segmentSize, size), number: segments.length + 1, start })
  }

  const preferredConcurrency =
    collectionTransfer?.concurrency ??
    globalTransfer?.concurrency ??
    defaultTransferConfig.concurrency

  const concurrency = limits.isOrdered
    ? 1
    : Math.max(1, Math.min(preferredConcurrency, limits.maximumConcurrency))

  return { concurrency, segments, segmentSize }
}

export const shouldUseSegmentedUpload = ({
  collectionTransfer,
  globalTransfer,
  size,
}: {
  collectionTransfer?: UploadSessionTransferConfig
  globalTransfer?: UploadSessionTransferConfig
  size: number
}): boolean =>
  size >=
  (collectionTransfer?.multipartThreshold ??
    globalTransfer?.multipartThreshold ??
    defaultTransferConfig.multipartThreshold)

const roundUpToGranularity = ({ granularity, value }: { granularity: number; value: number }) =>
  granularity > 1 ? Math.ceil(value / granularity) * granularity : value
