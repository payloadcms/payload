import { validateMimeType } from 'payload/shared'

/**
 * Whether an upload collection accepts a file. A collection with no MIME types accepts every file.
 */
export const isFileTypeAccepted = ({
  file,
  mimeTypes,
}: {
  file: File
  mimeTypes: string[] | undefined
}): boolean => !mimeTypes?.length || validateMimeType(file.type, mimeTypes)
