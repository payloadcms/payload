import { buildStoragePathData } from '@payloadcms/plugin-cloud-storage/utilities'

interface GenerateURLArgs {
  baseURL: string
  collectionPrefix?: string
  containerName: string
  filename: string
  prefix: string
  useCompositePrefixes?: boolean
}

export function generateURL({
  baseURL,
  collectionPrefix = '',
  containerName,
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

  return `${baseURL}/${containerName}/${storageFilePath}`
}
