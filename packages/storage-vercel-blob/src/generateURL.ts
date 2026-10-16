import { buildStoragePathData } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface GenerateURLArgs {
  baseUrl: string
  collectionPrefix?: string
  filename: string
  prefix: string
  useCompositePrefixes?: boolean
}

// Builds the public blob URL for a storage key, URL-encoding only the filename segment.
export function buildBlobUrl(baseUrl: string, fileKey: string): string {
  // example: "my-collection/my-doc/my file.jpg" -> "my-collection/my-doc"
  const dir = path.posix.dirname(fileKey)
  // example: "my file.jpg" -> "my%20file.jpg"
  const encodedFilename = encodeURIComponent(path.posix.basename(fileKey))
  // example: "my-collection/my-doc/my%20file.jpg"
  const fileKeyWithEncodedFilename =
    dir === '.' ? encodedFilename : path.posix.join(dir, encodedFilename)

  return `${baseUrl}/${fileKeyWithEncodedFilename}`
}

export function generateURL({
  baseUrl,
  collectionPrefix = '',
  filename,
  prefix,
  useCompositePrefixes = false,
}: GenerateURLArgs): string {
  const { storageFilePath } = buildStoragePathData({
    collectionPrefix,
    docPrefix: prefix,
    filename,
    useCompositePrefixes,
  })

  return buildBlobUrl(baseUrl, storageFilePath)
}
