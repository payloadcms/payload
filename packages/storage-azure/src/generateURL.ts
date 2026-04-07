import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'

import { joinPrefixes } from '@payloadcms/plugin-cloud-storage/utilities'
import path from 'path'

interface Args {
  basePrefix?: string
  baseURL: string
  containerName: string
}

export const getGenerateURL =
  ({ basePrefix, baseURL, containerName }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    return `${baseURL}/${containerName}/${path.posix.join(joinPrefixes(basePrefix, prefix), filename)}`
  }
