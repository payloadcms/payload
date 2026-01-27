import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import path from 'path'

type GenerateUrlArgs = {
  baseUrl: string
  prefix?: string
}

export const getGenerateUrl = ({ baseUrl }: GenerateUrlArgs): GenerateURL => {
  return ({ filename, prefix = '' }) => {
    return `${baseUrl}/${path.posix.join(prefix, encodeURIComponent(filename))}`
  }
}
