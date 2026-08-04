import sanitize from 'sanitize-filename'

/**
 * Sanitizes an upload filename the same way `generateFileData.ts` does:
 * split off the extension, sanitize the base name with the `sanitize-filename`
 * npm package, then re-join.
 *
 * Using the same sanitizer on both the client-upload storage-key path and the
 * server-side DB-filename path guarantees the two stay in sync. Without this,
 * filenames containing characters like `:`, `?`, `*`, `<`, `>`, `|`, `"`, or
 * trailing dots/spaces end up stored under one key in the bucket but recorded
 * under a different name in the database, causing 404s on retrieval.
 */
export function sanitizeUploadFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  const ext = lastDot !== -1 ? filename.slice(lastDot + 1) : ''
  const baseName = sanitize(lastDot !== -1 ? filename.slice(0, lastDot) : filename)
  return ext ? `${baseName}.${ext}` : baseName
}
