'use client'
export const errorMessages = {
  413: "Upload failed: the request is too large for this deployment. Hosted / serverless providers (e.g. Vercel Functions, ~4.5 MB) often cap the request body lower than Payload's configured upload.limits.fileSize. For cloud-storage adapters like @payloadcms/storage-vercel-blob, enable clientUploads to bypass this limit, or upload a smaller file.",
}

const BYTES_PER_MB = 1024 * 1024
const VERCEL_FUNCTION_LIMIT_MB = 4.5

/**
 * Format a 413-specific error toast message that includes the actual upload
 * size when one is present in the FormData. Falls back to the static 413
 * message above when no file is found in the request body.
 *
 * Hosted / serverless providers commonly cap the function request body lower
 * than Payload's configured `upload.limits.fileSize` — Vercel Functions
 * documents a ~4.5 MB body limit. Surfacing the actual file size and the
 * recommended fix (`clientUploads: true` on the storage adapter) in the
 * upload error toast saves contributors a trip to the network tab.
 *
 * Source: https://vercel.com/docs/functions/configuring-functions/runtime#request-body-size-limit
 */
export const buildPayloadTooLargeMessage = ({
  body,
}: {
  body?: BodyInit | null
}): string => {
  if (!body || !(body instanceof FormData)) {
    return errorMessages[413]
  }

  let largestFileBytes = 0
  body.forEach((value) => {
    if (value instanceof Blob && value.size > largestFileBytes) {
      largestFileBytes = value.size
    }
  })

  if (largestFileBytes <= 0) {
    return errorMessages[413]
  }

  const fileMB = (largestFileBytes / BYTES_PER_MB).toFixed(1)
  return `Upload failed: this file is ${fileMB} MB, but this deployment can only accept about ${VERCEL_FUNCTION_LIMIT_MB} MB through the server upload route. Hosted / serverless providers (e.g. Vercel Functions) cap the request body lower than Payload's configured upload.limits.fileSize. For cloud-storage adapters like @payloadcms/storage-vercel-blob, enable clientUploads to bypass this limit, or upload a smaller file.`
}
