import sanitize from 'sanitize-filename'

import { APIError } from '../errors/APIError.js'

/**
 * Strips directory components and control characters from a filename,
 * leaving only the base filename. Mirrors `sanitizeFilename` from
 * `payload/shared`, which `getFileKey` applies when building storage keys.
 */
export function stripUploadFilenamePath(filename: string): string {
  let sanitized = filename.replace(/\\/g, '/')

  const lastSlash = sanitized.lastIndexOf('/')
  if (lastSlash !== -1) {
    sanitized = sanitized.slice(lastSlash + 1)
  }

  if (sanitized === '.' || sanitized === '..') {
    return ''
  }

  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '')

  return sanitized
}

/**
 * Sanitizes an upload filename, mirroring the non-image branch of
 * `generateFileData.ts`: strip path components, extract the extension
 * (stripping any `?...` query suffix), sanitize the base name with
 * `sanitize-filename`, then re-join.
 *
 * Exported via `payload/internal` so the cloud-storage client-upload path
 * (`resolveSignedURLKey`) and the server-side upload pipeline derive the
 * filename from the same logic, keeping the storage key and the DB filename
 * in sync. Without this, filenames containing characters like `:`, `?`, `*`,
 * `<`, `>`, `|`, `"`, or trailing dots/spaces end up stored under one key in
 * the bucket but recorded under a different name in the database, causing
 * 404s on retrieval.
 *
 * `generateFileData.ts` computes `ext` from the file buffer for images (via
 * `file-type`), so it cannot use this helper directly — its non-image branch
 * is the source of truth mirrored here. Keep the two in sync.
 */
export function sanitizeUploadFilename(filename: string): string {
  const nameOnly = stripUploadFilenamePath(filename)

  if (!nameOnly) {
    throw new APIError('Invalid filename', 400)
  }

  let ext = ''
  if (nameOnly.includes('.')) {
    ext = nameOnly.split('.').pop()?.split('?')[0] ?? ''
  }
  const baseFilename = sanitize(nameOnly.substring(0, nameOnly.lastIndexOf('.')) || nameOnly)
  return `${baseFilename}${ext ? `.${ext}` : ''}`
}
