import sanitize from 'sanitize-filename'

/**
 * Sanitizes an upload filename, mirroring the non-image branch of
 * `generateFileData.ts`: extract the extension (stripping any `?...` query
 * suffix), sanitize the base name with `sanitize-filename`, then re-join.
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
  let ext = ''
  if (filename.includes('.')) {
    ext = filename.split('.').pop()?.split('?')[0] ?? ''
  }
  const baseFilename = sanitize(filename.substring(0, filename.lastIndexOf('.')) || filename)
  return `${baseFilename}${ext ? `.${ext}` : ''}`
}
