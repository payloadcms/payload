import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

interface Args {
  baseURL: string
  collectionPrefix?: string
  containerName: string
  useCompositePrefixes?: boolean
}

export const getGenerateURL =
  ({
    baseURL,
    collectionPrefix = '',
    containerName,
    useCompositePrefixes = false,
  }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: prefix,
      filename,
      useCompositePrefixes,
    })
    return `${baseURL}/${containerName}/${fileKey}`
  }
