import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

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
  const fileKey = getFileKey({
    collectionPrefix,
    docPrefix: prefix,
    filename: encodeURIComponent(filename),
    useCompositePrefixes,
  })

  return `${baseUrl}/${fileKey}`
}
