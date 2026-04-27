import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface GenerateURLArgs {
  baseUrl: string
  collectionPrefix?: string
  filename: string
  prefix: string
  useCompositePrefixes?: boolean
}

export function generateURL({
  baseUrl,
  collectionPrefix = '',
  filename,
  prefix,
  useCompositePrefixes = false,
}: GenerateURLArgs): string {
  const { fileKey: fileKeyWithPrefix } = getFileKey({
    collectionPrefix,
    docPrefix: prefix,
    filename,
    useCompositePrefixes,
  })
  // example: "my-collection/my-doc/my file.jpg" -> "my-collection/my-doc"
  const dir = path.posix.dirname(fileKeyWithPrefix)
  // example: "my file.jpg" -> "my%20file.jpg"
  const encodedFilename = encodeURIComponent(path.posix.basename(fileKeyWithPrefix))
  // example: "my-collection/my-doc/my%20file.jpg"
  const fileKeyWithEncodedFilename =
    dir === '.' ? encodedFilename : path.posix.join(dir, encodedFilename)

  return `${baseUrl}/${fileKeyWithEncodedFilename}`
}
