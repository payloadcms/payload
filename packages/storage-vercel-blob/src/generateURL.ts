import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

type GenerateUrlArgs = {
  baseUrl: string
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

export const getGenerateUrl = ({
  baseUrl,
  collectionPrefix = '',
  useCompositePrefixes = false,
}: GenerateUrlArgs): GenerateURL => {
  return ({ filename, prefix = '' }) => {
    const fileKey = getFileKey({
      collectionPrefix,
      docPrefix: prefix,
      filename: encodeURIComponent(filename),
      useCompositePrefixes,
    })
    return `${baseUrl}/${fileKey}`
  }
}
