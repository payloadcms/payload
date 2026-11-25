import { validateMimeType } from 'payload/shared'

/**
 * Whether an upload collection accepts a file. A collection with no MIME types accepts every file.
 * Takes a `Blob` so that files fetched from a URL can be checked too. A `File` is a `Blob`.
 */
export const isFileTypeAccepted = ({
  file,
  mimeTypes,
}: {
  file: Blob
  mimeTypes: string[] | undefined
}): boolean => !mimeTypes?.length || validateMimeType(file.type, mimeTypes)
