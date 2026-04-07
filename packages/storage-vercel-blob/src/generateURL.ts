import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

type GenerateUrlArgs = {
  basePrefix?: string
  baseUrl: string
}

export const getGenerateUrl = ({ basePrefix, baseUrl }: GenerateUrlArgs): GenerateURL => {
  return ({ filename, prefix = '' }) => {
    return `${baseUrl}/${path.posix.join(joinPrefixes(basePrefix, prefix), encodeURIComponent(filename))}`
  }
}
