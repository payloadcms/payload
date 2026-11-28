/**
 * `hasRequestedStatus` / `requestedStatus` are captured before `normalizeAllLocalesPublicationStatus`
 * and `beforeOperation` so a generated publish status is not treated as caller intent (#19449).
 *
 * A `beforeOperation` hook may still add or change `_status` after that capture. Detect that
 * change relative to the post-normalize, pre-hook value so hook-set publish/draft intent is
 * honored without misclassifying generated status (unchanged across the hook boundary).
 */
export const resolveRequestedStatusAfterBeforeOperation = ({
  hasRequestedStatus,
  requestedStatus,
  statusAfterOperation,
  statusBeforeOperation,
}: {
  hasRequestedStatus: boolean
  requestedStatus: unknown
  statusAfterOperation: unknown
  statusBeforeOperation: unknown
}): {
  hasRequestedStatus: boolean
  requestedStatus: unknown
} => {
  if (
    !hasRequestedStatus &&
    statusAfterOperation !== statusBeforeOperation &&
    (statusAfterOperation === 'draft' || statusAfterOperation === 'published')
  ) {
    return {
      hasRequestedStatus: true,
      requestedStatus: statusAfterOperation,
    }
  }

  return { hasRequestedStatus, requestedStatus }
}

export const readDataStatus = (data: unknown): unknown => {
  if (
    typeof data === 'object' &&
    data !== null &&
    Object.prototype.hasOwnProperty.call(data, '_status')
  ) {
    return (data as { _status?: unknown })._status
  }

  return undefined
}
